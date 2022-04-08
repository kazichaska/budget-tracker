// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);


// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection
    // save reference to db in global variable
    db = event.target.result;

    // check if app is online, if eys run uploadBudget() function to send all local db data to api
    if (navigator.onLine) {
        // we have not created this yet, but we will soon, so lets comment it out for now
        uploadBudget();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
}

// Thid function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for `new_transaction`
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

// function that will handle collecting all of the data 
function uploadBudget() {
    alert("online")
    // open transaction on your pending db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDB's store, let's send it to the API server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    // open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    // access the object store
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    // clear all items in your store
                    budgetObjectStore.clear();
                })
                .catch(err => {
                    // set referrence to redirect back here
                    console.log(err);
                });

        }
    }
}

// listen for app coming back onlinen
window.addEventListener('online', uploadBudget);