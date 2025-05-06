import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [stack, setStack] = useState([]);
  const [compareMethod, setCompareMethod] = useState(0); // 0: 大於先，1: 小於先
  const [newItem, setNewItem] = useState('');
  const [message, setMessage] = useState('');
  const [maxSize, setMaxSize] = useState(''); // 最大容量

  // 創建 Stack
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
      // 如果後端有回傳 maxsize，可以這樣設定
      if (response.data.maxsize) {
        setMaxSize(response.data.maxsize);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Push 元素
  const pushItem = async () => {
    if (!newItem) {
      setMessage('Please enter a number');
      return;
    }
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/push', {
        value: newItem,
      });
      setStack(response.data.stack);
      setMessage(response.data.message);
      setNewItem('');
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while pushing the item.');
    }
  };

  // Pop 元素
  const popItem = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/stack/pop');
      if (response.data.stack) {
        setStack(response.data.stack);
        setMessage(response.data.message);
      } else {
        setMessage("Stack is empty");
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

  // 顯示 Stack
  const displayStack = () => {
    if (stack.length === 0) {
      return <li>(Stack is empty)</li>;
    }
    return stack.slice().reverse().map((item, index) => <li key={index}>{item}</li>);
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Stack App</h1>

      {/* 輸入 maxSize */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="number"
          value={maxSize}
          onChange={(e) => setMaxSize(e.target.value)}
          placeholder="Enter max size"
        />
      </div>

      {/* 建立 Stack */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => createStack(0)}>創建 Stack (降序)</button>
        <button onClick={() => createStack(1)} style={{ marginLeft: '5px' }}>
          創建 Stack (升序)
        </button>
      </div>

      {/* Push / Pop / Clear */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Enter a number"
        />
        <button onClick={pushItem} style={{ marginLeft: '5px' }}>
          Push Item
        </button>
        <button onClick={popItem} style={{ marginLeft: '5px' }}>
          Pop Item
        </button>
        <button onClick={clearStack} style={{ marginLeft: '5px' }}>
          Clear Stack
        </button>
      </div>

      {/* 顯示訊息 */}
      <div style={{ marginBottom: '10px', color: 'blue' }}>
        <h3>{message}</h3>
      </div>

      {/* 顯示 Stack 狀態 */}
      <div style={{ marginBottom: '10px' }}>
        <strong>元素數量：</strong> {stack.length} / 
        <strong> 最大容量：</strong> {maxSize || "未設定"}
      </div>

      {/* 顯示 Stack 內容 */}
      <div>
        <h2>Stack Content</h2>
        <ul>{displayStack()}</ul>
      </div>
    </div>
  );
}

export default App;
