import { observe, register, mount, select, type Controller } from "@lib";

const Controller: Controller<HTMLElement> = ({ root }) => {
  console.log(select("alias"));
};

register("controller", Controller);

window.addEventListener("DOMContentLoaded", () => {
  observe(document.documentElement);
});
