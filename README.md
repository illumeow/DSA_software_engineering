# Monotonic Stack Explorer

## Introduction

This web app demonstrate how a monotonic stack works. It provides a visual animation of items pop and push in the stack. Also, it has a history log to show what you have done before.

## Usage
When you open the web app, you will see the interface as shown below:

<img style="display:block; margin:20px auto; padding:1px; border:1px #eee;width:80%;" src="https://hackmd.io/_uploads/r1vUbFybgx.png" />

To create a monotonic stack, you need to enter a max size of it, and use the toggle to choose the type of element and the order of the stack. The default is as shown, which it a monotonic increasing integer stack.

After creating the stack, you can start to push and pop element.

To push an element, enter an integer (or string), then press the `Push` button. If elements should be popped to maintain the monotone, you will see an animation of them popping out one by one, then the element will be pushed.

To pop an element, simply press the `Pop` button.

Also, you can see that you can clear the stack or the history log by the button below.

For a short introduction, press the `What is Monotonic Stack` button in the up-right.

You will see a message on top of `Elements: / Max size: ` after pressing any button. If there is any error, the message will tell you.

Message Example:

<img style="display:block; margin:20px auto; padding:1px; border:1px #eee;width:80%;" src="https://hackmd.io/_uploads/SyaZuYk-ex.png" />

The message `Stack is full` appear when you press the push button when the stack is full.

