from fastapi import FastAPI,WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 加 CORS，這樣前端可以直接連
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 建立一個假的 Stack
history_log =[]
stack = []
size = 0
max_size = 1000  # 最大 stack 大小
# 定義比較函數
# method==0 大於 method==1 小於  
compare_method = 0  
def cmp(a,b,x)->int:
    if x==0:
        return int(a-b)
    elif x==1:
        return int(b-a)
# 定義接收格式
class Create_Item(BaseModel):
    value: str  # 可以是文字，想要 int 的話改成 int
    maxsize: int  # 最大 stack 大小
class Item(BaseModel):
    value: str  # push 的時候只要 value，不要 maxsize

@app.post("/stack/create")
async def create_stack(item: Create_Item):
    global stack, compare_method,size,max_size
    stack = []  # 重建新的空 stack
    size = 0
    max_size = item.maxsize  # 從 item 取出 maxsize
    compare_method = int(item.value)  # 記住比較方法
    return {
        "message": "Stack created",
        "stack": stack,
        "compare_method": compare_method
    }
# PUSH (接收參數)
@app.post("/stack/push")
async def push_item(item: Item):
    temp = []
    temp_size = 0
    re_arr = [] 
    method_arr = []
    popped = []
    global stack, size, compare_method, max_size, history_log
    if(size >= max_size):
        return {"message": "Stack is full", "stack": stack, "history": history_log, "popped": popped}
    while(size > 0):
        if(cmp(int(item.value), int(stack[size-1]), compare_method) < 0):
            value = stack[size-1]
            stack.pop()
            popped.append(value)
            temp = stack.copy()
            size -= 1
            method_arr.append(f"pop:{value}")     
            history_log.append(f"pop:{value}")     
            re_arr.append(temp)
        else: 
            break
    history_log.append(f"push:{item.value}")
    temp = stack.copy()
    method_arr.append(f"push:{item.value}")
    re_arr.append(temp)
    stack.append(item.value)
    size += 1

    return {
        "message": "Pushed successfully",
        "stack": stack,
        "history": history_log,
        "return_arr": re_arr,
        "method_arr": method_arr,
        "popped": popped
    }

# POP
@app.post("/stack/pop")
async def pop_item():
    global size,history_log
    re_arr = []
    size-=1
    if stack:
        removed = stack.pop()
        re_arr=stack.copy()
        history_log.append(f"pop:{removed}")
        return {"message": f"Popped {removed}", "stack": stack,"history": history_log}
    
    return {"message": "Stack is empty size{size}", "stack": stack,"history": history_log,"return_arr":re_arr}

# GET 全部 stack
@app.get("/stack/status")
async def get_stack():
    return stack

# 清空 Stack
@app.post("/stack/clear")
async def clear_stack():
    global stack,size
    stack.clear()
    size = 0
    return {"message": "Stack cleared", "stack": stack}
@app.post("/stack/clear_log")
async def clear_log():
    global history_log
    history_log = []
    return {"message": "Log cleared", "history": history_log}
