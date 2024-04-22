<script setup>
import { computed, onBeforeMount, ref, onMounted } from "vue";
import SrMessages from "./components/SrMessages.vue";
import { useToast } from "vue-toast-notification";

const toast = useToast();

// Reactive vars that we'll use in our template
const readersList = ref(null);
const readerId = ref(null);
const reader = ref(null);
const paymentIntent = ref(null);
const description = ref(null);
let checkClick = ref(null);
let rr = ref(null);
let amount = ref(null);
const reactiveVariable = ref("nuller");

// For error messages
const messages = ref([]);

// Get readers before mounting the component
onBeforeMount(async () => {
  const response = await fetch("/api/readers");
  const result = await response.json();
  readersList.value = result.readersList;
});

// Persist data when the component is mounted
onMounted(async () => {
  const socket = new WebSocket("ws://localhost:4242");
  socket.onopen = () => {
    console.log("WebSocket connection established");
  };
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    console.log("data.type", data.type);
    switch (data.type) {
      case "payment_intent.created":
        toast.success("Payment Intent Created");
        break;
      case "terminal.reader.action_succeeded":
        toast.success("Reader Action Succeeded");
        break;
      case "charge.failed":
        toast.error("Charge Failed");
        break;
      case "checkout.session.async_payment_failed":
        toast.error("Checkout Session Async Payment Failed");
        break;
      case "invoice.payment_failed":
        toast.error("Invoice Payment Failed");
        break;
      case "payment_intent.canceled":
        toast.error("Payment Intent Canceled");
        break;
      case "charge.refunded":
        toast.error("Charge Refunded");
        break;
      case "charge.refund.updated":
        toast.error("Charge Refund Updated");
        break;
      case "payment_intent.payment_failed":
        toast.error("Payment Intent Failed");
        break;
      case "setup_intent.setup_failed":
        toast.error("Setup Intent Failed");
        break;
      case "subscription.payment_failed":
        toast.error("Subscription Payment Failed");
        break;
      case "payment_intent.amount_capturable_updated":
        toast.success("Amount Captured by Reader");
        break;
      case "charge.succeeded":
        toast.success("Payment Successful");
        break;
      default:
        console.log("else", data.type);
    }
  };
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
});

//other fx
let amountObj = {
  dollar: "",
  cent: "",
};
const input2Fx = () => {
  amountObj.cent = amountObj.cent.toString();
  let firstTwoDigits = amountObj.cent.slice(0, 2);
  if (amountObj.cent.length > 2) {
    alert("Input two digits only");
  }
  amountObj.cent = parseInt(firstTwoDigits);
  input1Fx();
};

const input1Fx = () => {
  const oldCent = amountObj.cent ? amountObj.cent : "00";
  const newCent = oldCent.toString();
  const newDollar = amountObj.dollar.toString();
  const tt = `${newDollar}${newCent}`;
  amount.value = parseInt(tt);
};

const checkBtn = () => {
  if (!checkClick.value) {
    simulatePayment();
  } else {
    alert("Already clicked! Now click on 'Receive' to proceed");
  }
};
const checkRecBtn = () => {
  if (!checkClick.value) {
    alert("Click on 'Pay Now' first bedore preceeding to Receive");
  } else {
    capturePayment();
  }
};

let processor;
// Process payment click handler
const processPayment = async () => {
  const response = await fetch("/api/readers/process-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.value,
      readerId: readerId.value,
      description: `WALK-IN: ${description.value}`,
    }),
  });
  const result = await response.json();
  const checker = result.reader.status;

  // checkCancel =  checker;
  document.getElementById(
    "gif"
  ).innerHTML = `<img src="https://cdn.pixabay.com/animation/2022/11/30/19/48/19-48-34-65_512.gif" alt="animated gif" />`;

  if (checker === "online") {
    document.getElementById("cancel-button").disabled = false;
  } else {
    document.getElementById("cancel-button").disabled = true;
  }
  const { error } = result;
  if (error) {
    toast.error(error.message);
    addMessage(error.message);
    return;
  }
  reader.value = result.reader;
  checkClick.value = "";
  paymentIntent.value = result.paymentIntent;
  toast.success("Reader added successfully!");
  addMessage(
    `processing payment for ${amount.value} on reader ${reader.value.label}`
  );
};

// Cancel action click handler
const cancelAction = async () => {
  const response = await fetch("/api/readers/cancel-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentIntent: paymentIntent.value.id }),
  });
  const result = await response.json();
  document.getElementById(
    "gif"
  ).innerHTML = `<img src="https://cdn.pixabay.com/animation/2022/11/03/16/42/16-42-39-820_512.gif" alt="animated gif" />`;
  const { error } = result;
  if (error) {
    toast.error(error.message);
    addMessage(error.message);
    return;
  }
  reader.value = result.reader;
  checkClick.value = "";
  toast.success("Cancelled successfully!");
  addMessage(
    `Canceled reader action on ${reader.value.label} on reader ${reader.value.id}`
  );
  reset();
};

const resetAction = () => {
  window.location.reload();
};

// Simulate payment click handler
const simulatePayment = async () => {
  const response = await fetch("/api/readers/simulate-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ readerId: reader.value.id }),
  });
  const result = await response.json();

  checkClick.value = result.reader.id;

  const { error } = result;
  if (error) {
    toast.error(error.message);
    addMessage(error.message);
    return;
  }

  addMessage(
    `Simulating a customer tapping their card on simulated reader ${reader.value.id} for payment`
  );
  document.getElementById(
    "gif"
  ).innerHTML = `<img src="https://cdn.pixabay.com/animation/2024/02/21/06/39/06-39-56-211_512.gif" alt="animated gif" />`;
};

// Capture payment click handler
const capturePayment = async (e) => {
  const response = await fetch("/api/payments/capture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentIntentId: paymentIntent.value.id }),
  });
  const result = await response.json();
  document.getElementById(
    "gif"
  ).innerHTML = `<img src="https://cdn.pixabay.com/animation/2023/03/10/13/25/13-25-13-552_512.gif" alt="animated gif" />`;
  const { error } = result;
  if (error) {
    toast.error(error.message);
    addMessage(error.message);
    return;
  }
  paymentIntent.value = result.paymentIntent;
  toast.success("Payment Captured successfully!");
  addMessage(
    `Capture payment for ${paymentIntent.value.id} ${reader.value.id}`
  );
  reset();
};

// Helpers
function reset() {
  paymentIntent.value = null;
  amount.value = null;
  reader.value = null;
  isProcessable = computed(() => {
    return amount.value >= 100 && readerId.value ? true : false;
  });
  isSimulateable = computed(() => {
    if (reader.value) {
      return reader.value?.device_type?.includes("simulated") &&
        paymentIntent?.value?.id
        ? true
        : false;
    }
    return false;
  });
  isCapturable = computed(() => {
    return paymentIntent?.value?.id ? true : false;
  });
  amountObj = {
    dollar: "",
    cent: "",
  };
}

function addMessage(message) {
  messages.value.push(message);
}

// Computed properties to handle enabling and disabling of buttons
// Don't worry about this stuff: it'll depend on your client.
let isSimulateable = computed(() => {
  if (reader.value) {
    return reader.value?.device_type?.includes("simulated") &&
      paymentIntent?.value?.id
      ? true
      : false;
  }
  return false;
});

let isCapturable = computed(() => {
  return paymentIntent?.value?.id ? true : false;
});

let isProcessable = computed(() => {
  return amount.value >= 100 && readerId.value ? true : false;
});
</script>

<template>
  <div class="grid-section">
    <div class="instructions">
      <h2>How to use the Stripe In-person Terminal</h2>
      <p><i class="fa-solid fa-caret-right"></i>&nbsp; Select a reader</p>
      <p><i class="fa-solid fa-caret-right"></i>&nbsp; Input payment invoice</p>
      <p>
        <i class="fa-solid fa-caret-right"></i>&nbsp; Input an amount for the
        transaction.
      </p>
      <p>
        <i class="fa-solid fa-caret-right"></i>&nbsp; Click on
        <b>"Check Reader"</b> to check the client's card
      </p>
      <!-- <p>
        <i class="fa-solid fa-caret-right"></i>&nbsp; Click on
        <b>"Pay Now"</b> to initiate transaction
      </p> -->
      <p>
        <i class="fa-solid fa-caret-right"></i>&nbsp; After payment has been
        made, click on <b>"Receive"</b> to receive payment
      </p>
    </div>
    <div class="sr-root">
      <main class="sr-main">
        <h2>In-Person Payments Terminal</h2>
        <p>Select a reader and input an amount for the transaction.</p>
        <section>
          <div>
            <p>
              <strong>Payment Intent ID:</strong
              ><span v-if="paymentIntent">{{ paymentIntent.id }}</span>
            </p>
            <p>
              <strong>Payment Intent status:</strong
              ><span v-if="paymentIntent">{{ paymentIntent.status }}</span>
            </p>
          </div>
          <p>
            <strong>Reader Status:</strong>
            <span v-if="reader">{{ reader?.action?.status }}</span>
          </p>
        </section>
        <form id="confirm-form">
          <label>Select Reader: </label>
          <select
            v-model="readerId"
            name="reader"
            id="reader-select"
            class="sr-select"
          >
            <option value="none" selected disabled>Select a reader</option>
            <option v-for="r in readersList" :value="r.id" :key="r.id">
              {{ r.label }} ({{ r.id }})
            </option>
          </select>
          <label for="description"></label>
          <input
            v-model="description"
            id="description"
            type="text"
            class="sr-input3"
            placeholder="Add Invoice Number"
            autocomplete="off"
          />
          <section class="sr-form-row">
            <label for="amount"><i class="fa-solid fa-dollar-sign"></i></label>
            <input
              v-model="amountObj.dollar"
              id="amount"
              type="number"
              class="sr-input1"
              placeholder="0000"
              autocomplete="off"
              @input="input1Fx"
            />
            <label for="amount"><i class="fa-solid fa-cent-sign"></i></label>
            <input
              v-model="amountObj.cent"
              id="amount"
              type="number"
              class="sr-input2"
              maxlength="2"
              placeholder="00"
              autocomplete="off"
              @input="input2Fx"
            />
          </section>
          <section class="button-row">
            <button
              type="button"
              id="capture-button"
              @click="processPayment"
              :disabled="!isProcessable"
            >
              1. Check Reader &nbsp; <i class="fa-regular fa-credit-card"></i>
            </button>
            <button
              type="button"
              id="capture-button"
              @click="capturePayment"
              :disabled="!isCapturable"
            >
              2. Receive &nbsp; <i class="fa-solid fa-record-vinyl"></i>
            </button>
          </section>
          <section class="button-row">
            <button
              id="simulate-payment-button"
              @click="checkBtn"
              type="button"
              :disabled="!isSimulateable"
            >
              2. Pay Now &nbsp; <i class="fa-solid fa-cart-shopping"></i>
            </button>

            <button @click="cancelAction" id="cancel-button" type="button">
              Cancel &nbsp; <i class="fa-solid fa-ban"></i>
            </button>
            <button @click="resetAction" id="cancel-button" type="button">
              Reset Reader &nbsp; <i class="fa-solid fa-house"></i>
            </button>
          </section>
          <sr-messages :messages="messages" />
        </form>
      </main>
    </div>
    <div class="gif img-fluid" id="gif">
      <img
        src="https://cdn.pixabay.com/animation/2022/11/03/16/42/16-42-39-820_512.gif"
        alt="animated gif"
      />
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.grid-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0 40px;
}
.instructions {
  /* width: 400px; */
  padding: 20px;
  background: #f1faee;
  text-align: left;
}
.gif {
  text-align: left;
}
.gif img {
  width: 400px;
  margin-left: 10%;
}

@media (max-width: 720px) {
  .grid-section {
    display: block;
    padding: 10px;
  }
  .instructions {
    padding: 10px;
    text-align: left;
  }
  .gif img {
    width: 100%;
    margin-left: 0%;
  }
  #app {
    margin-top: 0px;
  }
}
</style>
