import { createApp } from "vue";
import App from "./App.vue";
import "../assets/css/global.css";
import "../assets/css/normalize.css";
import ToastPlugin from "vue-toast-notification";
import "vue-toast-notification/dist/theme-bootstrap.css";
import "vue-toast-notification/dist/theme-sugar.css";

// createApp(App).mount("#app");

const app = createApp(App);


// app.use(router);
app.use(ToastPlugin, {
  position: "top-right",
});

app.mount("#app");