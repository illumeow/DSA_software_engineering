from fastapi import FastAPI
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
    global stack, size, compare_method,max_size
    if(size>=max_size):
        return {"message": "Stack is full", "stack": stack}
    while(size>0):
        if(cmp(int(item.value),int(stack[size-1]),compare_method)<0):
            temp.append(stack[size-1])
            temp_size+=1
            stack.pop()
            size-=1            
        else: 
            break
        
    stack.append(item.value)
    size+=1
    while(temp_size>0):
        stack.append(temp[temp_size-1])
        size+=1
        temp.pop()
        temp_size-=1

    return {"message": "Pushed successfully", "stack": stack}

# POP
@app.post("/stack/pop")
async def pop_item():
    global size
    size-=1
    if stack:
        removed = stack.pop()
        return {"message": f"Popped {removed}", "stack": stack}
    return {"message": "Stack is empty size{size}", "stack": stack}

# GET 全部 stack
@app.get("/stack")
async def get_stack():
    return stack

# 清空 Stack
@app.post("/stack/clear")
async def clear_stack():
    global stack,size
    stack.clear()
    size = 0
    return {"message": "Stack cleared", "stack": stack}
