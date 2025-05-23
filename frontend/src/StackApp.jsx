import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';

function App() {
  const [stack, setStack] = useState([]); // Now stores { value: any, id: string, animation: 'in' | 'out' | 'idle' }
  const [newItem, setNewItem] = useState('');
  const [message, setMessage] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [cmpMethod, setCmpMethod] = useState(1);
  const [elementType, setElementType] = useState('int');
  const [history, setHistory] = useState([]);
  const [currentMaxSize, setCurrentMaxSize] = useState('');
  const [currentElementType, setCurrentElementType] = useState('int');
  const [showIntro, setShowIntro] = useState(false);
  
  const animationItemIdCounter = useRef(0);

  const generateAnimationId = useCallback(() => {
    animationItemIdCounter.current += 1;
    return `anim-item-${Date.now()}-${animationItemIdCounter.current}`;
  }, []);

  const mapBackendStack = (backendStackArray) => {
    const newStackItems = [];
    // Make a mutable copy of current stack items that are not already animating out,
    // to track which old IDs can be reused.
    const availableOldItems = stack.filter(item => item.animation !== 'out').map(item => ({...item})); // Shallow copy

    for (const val of (backendStackArray || [])) {
      let existingId = null;
      // Find an available old item with the same value (comparing as strings for consistency)
      const reusableItemIndex = availableOldItems.findIndex(oldItem => String(oldItem.value) === String(val));

      if (reusableItemIndex !== -1) {
        existingId = availableOldItems[reusableItemIndex].id;
        availableOldItems.splice(reusableItemIndex, 1); // "Consume" this ID
      }

      newStackItems.push({
        value: val, // Store backend value (could be number or string)
        id: existingId || generateAnimationId(),
        animation: 'idle'
      });
    }
    return newStackItems;
  };
  
  const mapBackendStackWithInAnimation = (backendStackArray, pushedRawValue) => {
    const newStackItems = [];
    const availableOldItems = stack.filter(item => item.animation !== 'out').map(item => ({...item})); // Shallow copy
    let pushedItemIdentifiedForAnimation = false;

    // Determine the index of the item most likely just pushed.
    // Heuristic: It's the last item in the new backendStackArray that matches the pushedRawValue.
    let indexOfPushedInBackendArray = -1;
    if (backendStackArray && backendStackArray.length > 0) {
        for (let i = backendStackArray.length - 1; i >= 0; i--) {
            if (String(backendStackArray[i]) === String(pushedRawValue)) {
                indexOfPushedInBackendArray = i;
                break;
            }
        }
    }

    for (let i = 0; i < (backendStackArray || []).length; i++) {
      const val = backendStackArray[i];
      let existingId = null;
      
      const reusableItemIndex = availableOldItems.findIndex(oldItem => String(oldItem.value) === String(val));
      if (reusableItemIndex !== -1) {
        existingId = availableOldItems[reusableItemIndex].id;
        availableOldItems.splice(reusableItemIndex, 1); // "Consume" this ID
      }

      let animState = 'idle';
      if (i === indexOfPushedInBackendArray && !pushedItemIdentifiedForAnimation) {
        animState = 'in';
        pushedItemIdentifiedForAnimation = true;
      }

      newStackItems.push({
        value: val, // Store backend value
        id: existingId || generateAnimationId(),
        animation: animState
      });
    }
    return newStackItems;
  };

  // Create Stack function
  const createStack = async () => {
    try {
      if (!maxSize || maxSize === '') {
        setMessage('Please enter a max stack size.');
        return;
      }
      const payload = { method: parseInt(cmpMethod, 10), maxSize: parseInt(maxSize, 10), elementType: elementType };
      const response = await axios.post('http://127.0.0.1:8000/stack/create', payload);
      setStack(mapBackendStack(response.data.stack));
      setMessage(response.data.message);
      setHistory(response.data.history || []);
      setCurrentMaxSize(maxSize);
      setCurrentElementType(elementType);
      setMaxSize('');
    } catch (error) {
      console.error('Error creating stack:', error);
      setMessage('Failed to create stack');
    }
  };

  // Push item to stack
  const pushItem = async () => {
    if (currentMaxSize === '') {
      setMessage('Please create a stack first');
      return;
    }
    if (!newItem) {
      setMessage('Please enter a ' + (currentElementType === 'string' ? 'string' : 'integer'));
      return;
    }
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/push', { value: newItem });
      const { stack: newStackValues, message: responseMessage, popped: poppedValues = [], history: newHistory } = response.data;

      setMessage(responseMessage);
      setHistory(newHistory || []);

      if(responseMessage === "Stack is full") {
        return;
      }
      // --- Animation Sequence ---
      let currentAnimatedStack = [...stack]; // Start with current stack state

      // 1. Animate out popped items sequentially
      for (const poppedValue of poppedValues) {
        // Find the ID of the top-most item in the *current* visual stack that's about to be popped.
        // This assumes poppedValues are in the order they are popped from the top.
        const topVisibleItemIndex = currentAnimatedStack.slice().reverse().findIndex(item => item.animation !== 'out');
        if (topVisibleItemIndex === -1 && currentAnimatedStack.length > 0) { // All items are animating out or stack is visually empty
             // if there is still an item in currentAnimatedStack, it implies it's already animating out.
             // We wait for its animation to finish before proceeding or breaking.
             await new Promise(resolve => setTimeout(resolve, 500));
             currentAnimatedStack = currentAnimatedStack.filter(item => item.animation === 'out'); // keep only items still animating out
             if (currentAnimatedStack.find(item => item.value === poppedValue)) {
                // The item is already animating out, just update the reference stack after its assumed animation time.
                currentAnimatedStack = currentAnimatedStack.filter(item => item.value !== poppedValue);
             } else {
                // This case should ideally not happen if logic is correct.
                // If it does, break or log error. For now, we assume the item was found or already handled.
             }
             continue;
        } else if (topVisibleItemIndex === -1 && currentAnimatedStack.length === 0) {
            break; // No items to pop out visually
        }
        
        // Get actual index from original array perspective
        const actualItemToPopIndex = currentAnimatedStack.length - 1 - topVisibleItemIndex;
        const itemToPopId = currentAnimatedStack[actualItemToPopIndex].id;

        // Mark for 'out' animation
        currentAnimatedStack = currentAnimatedStack.map(item =>
          item.id === itemToPopId ? { ...item, animation: 'out' } : item
        );
        setStack(currentAnimatedStack);
        await new Promise(resolve => setTimeout(resolve, 500)); // Animation duration

        // Update local animated stack reference to reflect it's "gone" for next step
        currentAnimatedStack = currentAnimatedStack.filter(item => item.id !== itemToPopId);
      }

      // 2. Set stack to final state, with the new item marked for 'in' animation
      // newStackValues is the truth from backend. newItem is the value that was pushed.
      const finalStackWithInAnimation = mapBackendStackWithInAnimation(newStackValues, newItem);
      setStack(finalStackWithInAnimation);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // 'in' animation duration

      // 3. Clear 'in' animation, set to idle
      setStack(prev => prev.map(item =>
        item.value === (currentElementType === 'string' ? newItem : parseInt(newItem)) && item.animation === 'in' ? { ...item, animation: 'idle' } : item
      ));
      // --- End Animation Sequence ---

      setNewItem('');

    } catch (error) {
      console.error('Error pushing item:', error);
      let errorMsg = 'An error occurred while pushing the item.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setMessage(errorMsg);
      // Attempt to revert to a stable state if animations were interrupted.
      // This could be complex; for now, just set to last known history or refetch.
      // createStack(compareMethod); // Or simply map current stack to idle
      setStack(prev => prev.map(item => ({...item, animation: 'idle'})))
    }
  };
  
  // Pop item from stack
  const popItem = async () => {
    if (currentMaxSize === '') {
      setMessage('Please create a stack first');
      return;
    }
    if (stack.length === 0) {
      setMessage("Stack is empty");
      return;
    }
    
    // Find the top-most item that is not already animating out
    let topItemToPopId = null;
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].animation !== 'out') {
            topItemToPopId = stack[i].id;
            break;
        }
    }

    if (!topItemToPopId) {
        setMessage("No item available to pop (all items might be animating out)");
        return;
    }

    // Mark the identified top item for 'out' animation
    setStack(prevStack => prevStack.map(item =>
      item.id === topItemToPopId ? { ...item, animation: 'out' } : item
    ));
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/pop');
      setMessage(response.data.message);
      setHistory(response.data.history || []);
      
      // After animation, set stack to the new state from backend
      setTimeout(() => {
        setStack(mapBackendStack(response.data.stack));
      }, 500); // Animation duration

    } catch (error) {
      console.error('Error popping item:', error);
      setMessage('An error occurred while popping the item.');
      // Revert animation on error: set the item back to 'idle'
      setStack(prevStack => prevStack.map(item =>
        item.id === topItemToPopId ? { ...item, animation: 'idle' } : item
      ));
    }
  };

  // Clear Stack
  const clearStack = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/clear');
      setStack(mapBackendStack(response.data.stack)); // Should be an empty array
      setMessage(response.data.message);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error clearing stack:', error);
      setMessage('Failed to clear stack.');
    }
  };

  // Clear logs
  const clear_log = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/clear_log');
      setMessage(response.data.message);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error clearing log:', error);
      setMessage('Failed to clear log.');
    }
  };
  
  
  const displayhis_log = () => {
    if (!history || history.length === 0) {
      return <li className="text-gray-500 italic">(history is empty)</li>;
    }

    const reversedHistory = history.slice().reverse()
    let ret = []
    for (let i = 0; i < reversedHistory.length; i++) {
      const item = reversedHistory[i];
      if (item.startsWith("Create Stack")) {
        ret.push(<li className="text-sm text-gray-700 break-all">{item}<br/>{reversedHistory[i+1]}</li>);
        i++;
      } else {
        ret.push(<li className="text-sm text-gray-700 break-all">{item}</li>);
      }
    }
    return ret;
  };

  const displayIntro = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-row items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex-grow text-center">Introduction to Monotonic Stack</h2>
            <button
              onClick={() => setShowIntro(false)}
              className="text-gray-500 hover:text-gray-700 w-[10px] text-right"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 text-gray-700">
            <p>
              A monotonic stack is a stack that maintains its elements in either increasing or decreasing order.
              The order goes from bottom to top.
              It's particularly useful for solving problems involving finding the next greater/smaller element.
              This technique helps reduce the time complexity of many problems from O(n²) to O(n) by ensuring that each element is pushed and popped at most once.
            </p>
            
            <h3 className="font-semibold text-lg text-gray-800">Key Characteristics:</h3>
            <ul className="list-disc pl-5 space-y-2 mx-auto max-w-fit">
              <li className="text-left">Elements are always monotonic</li>
              <li className="text-left">When a new element is pushed, <br />elements that violate the order are popped</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800">Common Applications:</h3>
            <ul className="list-disc pl-5 space-y-2 mx-auto max-w-fit">
              <li className="text-left">Finding the next greater/smaller element in an array</li>
              <li className="text-left">Finding the largest rectangle in a histogram</li>
              <li className="text-left">Solving sliding window maximum/minimum problems</li>
              <li className="text-left">Maintaining a specific order of elements in a sequence</li>
            </ul>

            <h3 className="font-semibold text-lg text-gray-800">How to Use This Explorer:</h3>
            <ol className="list-decimal pl-5 space-y-2 mx-auto max-w-fit">
              <li className="text-left">Set the maximum size, element type, <br />and order of your stack</li>
              <li className="text-left">Create a stack</li>
              <li className="text-left">Push elements to see how they affect the stack</li>
              <li className="text-left">Watch how elements are automatically popped <br />to maintain the monotonic property</li>
              <li className="text-left">Full documentation is available <a href="https://hackmd.io/@illumeow/SJlu0O1Wxl" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">here</a></li>
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const changeElementType = (e) => {
    setElementType(e.target.checked ? 'string' : 'int');
  };

  const changeCmpMethod = (e) => {
    setCmpMethod(e.target.checked ? 0 : 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-4xl">
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="flex-grow lg:w-2/3 justify-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Monotonic Stack Explorer
            </h1>
          </div>
          <div className="flex-grow lg:w-1/3 lg:pl-8 justify-end">
            <button
              onClick={() => setShowIntro(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              What is Monotonic Stack?
            </button>
          </div>
        </div>

        {/* Introduction Modal */}
        {showIntro && displayIntro()}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls and Stack Visualization Column */}
          <div className="flex-grow lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <input
                type="number"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                placeholder="Enter max stack size"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <div className="flex flex-col gap-2">
                <div className="flex-1 flex flex-row gap-2">
                  <button
                    onClick={createStack}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold p-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Create
                  </button>
                  <div className="flex-1 flex items-center justify-center space-x-2">
                    <span className="text-gray-700">Integer</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={elementType === 'string'} onChange={changeElementType} />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-full"></div>
                    </label>
                    <span className="text-gray-700">String</span>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center space-x-2">
                  <span className="text-gray-700">Increasing</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={cmpMethod === 0} onChange={changeCmpMethod} />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-full"></div>
                  </label>
                  <span className="text-gray-700">Decreasing</span>
                </div>
              </div>
            </div>

            <div className="mb-6 flex gap-3 items-center">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={`Enter a ${currentElementType === 'string' ? 'string' : 'integer'} to push`}
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
              <button
                onClick={pushItem}
                disabled={stack.some(item => item.animation === 'in' || item.animation === 'out')} // Disable if animating
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              >
                Push
              </button>
              <button
                onClick={popItem}
                disabled={stack.some(item => item.animation === 'in' || item.animation === 'out')} // Disable if animating
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              >
                Pop
              </button>
            </div>

            <div className="mb-6 flex gap-3">
              <button
                onClick={clearStack}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                Clear Stack
              </button>
              <button
                onClick={clear_log}
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                Clear Log
              </button>
            </div>

            <div className="mb-3 text-center min-h-[24px]">
              <p className={`font-medium ${message.startsWith("Error") || message.startsWith("Failed") || message.startsWith("An error") ? 'text-red-600' : 'text-blue-600'}`}>{message}</p>
            </div>
            
            <div className="mb-4 text-center text-gray-700">
              <span className="font-semibold">Elements:</span> {stack.filter(item => item.animation !== 'out').length} / 
              <span className="font-semibold"> Max Size:</span> {currentMaxSize || "N/A"}
            </div>

            {/* Stack Visualization with U-Container */}
            <div className="relative stack-u-container flex flex-col-reverse items-center gap-2 py-2 min-h-[200px] bg-gray-50 rounded-b-lg">
              {stack.length === 0 && (<p className="text-gray-400 italic">Stack is empty</p>)}
              {stack.map((sItem) => {
                 // Determine if this item is visually the top-most non-animating-out item
                 const nonAnimatingOutItems = stack.filter(i => i.animation !== 'out');
                 const topVisualCandidate = nonAnimatingOutItems.length > 0 ? nonAnimatingOutItems[nonAnimatingOutItems.length - 1] : null;
                 const isVisuallyTop = topVisualCandidate && topVisualCandidate.id === sItem.id;

                 // Do not render the item at all if it has finished animating out and is not the one that was just pushed and immediately popped.
                 // This is a bit tricky; the CSS animation with 'forwards' should hide it. 
                 // If an item is 'out', it will have the 'item-animate-out' class.

                 return (
                    <div
                      key={sItem.id} // Use persistent ID for key
                      className={`
                        relative flex items-center justify-center h-12 rounded-lg
                        min-w-[160px] text-lg font-medium text-gray-800
                        transition-all duration-300 ease-in-out shadow-md hover:shadow-lg
                        ${sItem.animation === 'in' ? 'item-animate-in' : sItem.animation === 'out' ? 'item-animate-out' : ''}
                        ${isVisuallyTop
                          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white font-bold ring-2 ring-pink-300 scale-105'
                          : 'bg-white border border-gray-200'
                        }
                      `}
                      style={{
                        // zIndex helps ensure 'in' animations appear on top of static items if overlap occurs,
                        // and 'out' animations can be managed appropriately too.
                         zIndex: sItem.animation === 'in' ? 20 : (sItem.animation === 'out' ? 10 : 1) 
                      }}
                    >
                      {sItem.value}
                      {isVisuallyTop && (
                        <span className="absolute -top-2 -right-2 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full shadow animate-pulse">
                          Top
                        </span>
                      )}
                    </div>
                 );
              })}
            </div>
          </div>

          {/* History Log Column */}
          <div className="lg:w-1/3 lg:border-l lg:pl-8 border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 sticky top-0 bg-white py-2">History Log</h2>
            <ul style={{ height: `${stack.length > 1 ? `calc(${196 + 8 * stack.length}px + ${(19 + stack.length * 12) * 0.25}rem)` : 'calc(286px + 4.75rem)'}` }} className="bg-gray-50 rounded-lg p-4 space-y-2 overflow-y-auto shadow-inner">
              {displayhis_log()}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
