# Stripe Terminal Series - Collecting payments with Stripe Terminal

This project has an already scaffolded Express JS backend and Vue.js frontend.

## Installation

1. Download the repository
2. Open the folder in your VSCode or any code editor
3. Open your code terminal and type the comand $ cd client
4. Run $ npm install
5. Run $ npm run build
6. Run $ cd ..
7. Run cd server
8. Run $ npm install
9. Run npm run start

If you're using mac os, ensure you have stripe cli installed globally then run the following commands
1. $ stripe login
2. $ stripe listen --forward-to localhost:5002/webhook
3. $ srtripe trigger payment_intent.succeeded [Check stripe dashboard for other stripe events to run]

You can also clone the repository, but there is a bit more manual setup work to
configure the `.env` environment variable file in the server directory.

If you're using using Desktop windows, we've already downloaded stripe into the repo. Run the following commands in your Windows Command Prompt.

Firstly cd < folder directory >
1. $ stripe login
2. $ stripe listen --forward-to localhost:5002/webhook
3. $ srtripe trigger payment_intent.succeeded [Check stripe dashboard for other stripe events to run]

After this 3 steps for Desktop windows users, going forward, you can run the StartApp.bat executable file outside your code editor, and then the startStripeCLI.bat also.



