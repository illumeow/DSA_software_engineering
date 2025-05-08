import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [stack, setStack] = useState([]);
  const [compareMethod, setCompareMethod] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [message, setMessage] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [history, setHistory] = useState([]);
  const [floating, setFloating] = useState(null);

  // Create Stack function
  const createStack = async (method) => {
    try {
      const payload = { value: method.toString() };
      if (maxSize !== '') {
        payload.maxsize = parseInt(maxSize, 10);
      }

      const response = await axios.post('http://127.0.0.1:8000/stack/create', payload);
      setStack(response.data.stack);
      setCompareMethod(method);
      setMessage(response.data.message);
      if (response.data.maxsize) {
        setMaxSize(response.data.maxsize);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Push item to stack
  const pushItem = async () => {
    if (!newItem) {
      setMessage('Please enter a number');
      return;
    }
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/push', { value: newItem });
      setStack(response.data.stack);
      setMessage(response.data.message);

      // Animate all popped elements
      if (response.data.popped && response.data.popped.length > 0) {
        // If multiple, animate one by one, or all together
        setFloating(response.data.popped.join(', ')); // Show all popped as a string
        setTimeout(() => setFloating(null), 1500);
      }

      setHistory(response.data.history || []);
      setNewItem('');
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while pushing the item.');
    }
  };

  // Pop item from stack
  const popItem = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/pop');
      if (response.data.stack) {
        setStack(response.data.stack);
        setMessage(response.data.message);
        setHistory(response.data.history);
      } else {
        setMessage("Stack is empty");
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Clear Stack
  const clearStack = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/clear');
      setStack(response.data.stack);
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
    }
  };

  // Clear logs
  const clear_log = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/clear_log');
      setMessage(response.data.message);
      setHistory(response.data.history);
    } catch (error) {
      console.error(error);
    }
  };

  // Display stack
  const displayStack = () => {
    if (stack.length === 0) {
      return <li>(Stack is empty)</li>;
    }
    return stack.slice().reverse().map((item, index) => <li key={index}>{item}</li>);
  };


  // Display history logs
  const displayhis_log = () => {
    if (history.length === 0) {
      return <li>(history is empty)</li>;
    }
    return history.slice().map((item, index) => <li key={index}>{item}</li>);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">Monotonic Stack</h1>

        <div className="mb-4">
          <input
            type="number"
            value={maxSize}
            onChange={(e) => setMaxSize(e.target.value)}
            placeholder="Enter max size"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => createStack(0)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded transition"
          >
            創建 Stack (降序)
          </button>
          <button
            onClick={() => createStack(1)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition"
          >
            創建 Stack (升序)
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Enter a number"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={pushItem}
            className="bg-blue-400 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded transition"
          >
            Push
          </button>
          <button
            onClick={popItem}
            className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-3 py-2 rounded transition"
          >
            Pop
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={clearStack}
            className="flex-1 bg-red-400 hover:bg-red-500 text-white font-semibold py-2 rounded transition"
          >
            Clear Stack
          </button>
          <button
            onClick={clear_log}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded transition"
          >
            Clear Log
          </button>
        </div>

        <div className="mb-4 text-blue-600 text-center min-h-[24px]">
          <h3>{message}</h3>
        </div>

        <div className="mb-4 text-center">
          <span className="font-semibold">元素數量：</span> {stack.length} / 
          <span className="font-semibold"> 最大容量：</span> {maxSize || "未設定"}
        </div>

        <div className="relative flex flex-col items-center">
          {/* Stack 內容 */}
          <div className="flex flex-col-reverse items-center gap-2">
            {stack.map((item, idx) => (
              <div
                key={idx}
                className={`
                  relative flex items-center justify-center h-12 rounded-xl
                  min-w-[180px]
                  transition-all duration-500 ease-out
                  ${idx === stack.length - 1
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 text-white font-extrabold shadow-2xl scale-110 ring-4 ring-pink-300/60'
                    : 'bg-white/80 text-gray-800 shadow-md border border-gray-200/60'}
                  hover:scale-105 hover:shadow-xl
                `}
                style={{
                  boxShadow: idx === stack.length - 1
                    ? '0 4px 32px 0 rgba(236, 72, 153, 0.25), 0 1.5px 6px 0 rgba(59, 130, 246, 0.15)'
                    : undefined
                }}
              >
                {item}
                {idx === stack.length - 1 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-pink-500/90 text-white px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                    Top
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* 飄移動畫 */}
          {floating && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-0 animate-float-out bg-pink-400 text-white font-bold px-8 py-2 rounded-xl shadow-2xl z-20 min-w-[180px]"
              style={{ pointerEvents: 'none' }}
            >
              {floating}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-700">History Log</h2>
          <ul className="bg-gray-100 rounded p-3 min-h-[40px]">
            {displayhis_log()}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
