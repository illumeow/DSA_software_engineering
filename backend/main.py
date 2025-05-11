from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# add CORS, so the frontend can connect to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


history_log = []

stack = []
size = 0
maxsize = 0

compare_method = 0  # 0: decreasing, 1: increasing

def cmp(a: int, b: int, x: int) -> int:
    if x == 0:
        return a > b
    elif x == 1:
        return a < b
    
# define the format of the data received
class Create_Item(BaseModel):
    value: str  # can be string or int
    maxsize: int

class Item(BaseModel):
    value: str  # only need value for push

@app.post("/stack/create")
async def create_stack(item: Create_Item):
    global stack, compare_method, size, maxsize, history_log
    stack = []  # rebuild a new empty stack
    size = 0
    maxsize = item.maxsize  # get maxsize from item
    compare_method = int(item.value)  # remember the compare method

    history_log.append(f"with max size: {maxsize}")
    history_log.append(f"Create Stack ({'Decreasing' if compare_method == 0 else 'Increasing'})")

    return {
        "message": "Stack created",
        "stack": stack,
        "history": history_log
    }

# PUSH (receive parameters)
@app.post("/stack/push")
async def push_item(item: Item):
    global stack, size, compare_method, maxsize, history_log
    popped = []

    if(size >= maxsize):
        return {"message": "Stack is full", "stack": stack, "history": history_log, "popped": popped}
    
    while(size > 0 and cmp(int(item.value), int(stack[size-1]), compare_method)):
        value = stack.pop()
        popped.append(value)
        size -= 1    
        history_log.append(f"pop: {value}")   

    stack.append(item.value)
    size += 1

    history_log.append(f"push: {item.value}")

    return {
        "message": "Pushed successfully",
        "stack": stack,
        "history": history_log,
        "popped": popped
    }

@app.post("/stack/pop")
async def pop_item():
    global size, history_log
    # stack will not be empty, because we check it in the frontend
    removed = stack.pop()
    size -= 1
    history_log.append(f"pop: {removed}")
    return {"message": f"Popped {removed}", "stack": stack, "history": history_log}

@app.post("/stack/clear")
async def clear_stack():
    global stack, size, history_log
    stack.clear()
    size = 0
    history_log.append("Clear Stack")
    return {"message": "Stack cleared", "stack": stack, "history": history_log}

@app.post("/stack/clear_log")
async def clear_log():
    global history_log
    history_log.clear()
    return {"message": "History Log cleared", "history": history_log}
