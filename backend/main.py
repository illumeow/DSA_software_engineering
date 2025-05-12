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
elementType = "int"

cmp_method = 0  # 0: decreasing, 1: increasing

def cmp(a: int|str, b: int|str, x: int) -> bool:
    return a > b if x == 0 else a < b
    
# define the format of the data received
class Create_Item(BaseModel):
    method: int  # 0: decreasing, 1: increasing
    maxSize: int
    elementType: str  # "int" or "string"

class Item(BaseModel):
    value: int|str

@app.post("/stack/create")
async def create_stack(item: Create_Item):
    global stack, cmp_method, size, maxsize, history_log, elementType
    stack = []
    size = 0
    cmp_method = item.method
    maxsize = item.maxSize
    elementType = item.elementType

    history_log.append(f"with max size: {maxsize}")
    history_log.append(f"Create Stack ({'Decreasing' if cmp_method == 0 else 'Increasing'})")

    return {
        "message": "Stack created",
        "stack": stack,
        "history": history_log
    }

@app.post("/stack/push")
async def push_item(item: Item):
    global stack, size, cmp_method, maxsize, history_log
    popped = []
    
    if size >= maxsize:
        return {"message": "Stack is full", "stack": stack, "history": history_log, "popped": popped}

    push_value = item.value if elementType == "string" else int(item.value)
    
    while(size > 0 and cmp(push_value, stack[size-1], cmp_method)):
        value = stack.pop()
        popped.append(value)
        size -= 1    
        history_log.append(f"pop: {value}")   

    stack.append(push_value)
    size += 1

    if elementType == "string":
        history_log.append(f"push: \"{push_value}\"")
    else:
        history_log.append(f"push: {push_value}")

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
