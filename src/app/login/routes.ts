import Login from "./Login";

export const states = [{
  name: 'login',
  url: '/login',
  component: Login,
  params: {
    reauth: false
  }
}];
