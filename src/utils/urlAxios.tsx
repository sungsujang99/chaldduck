import axios from "axios";

const urlAxios = axios.create({
    baseURL: "https://찰떡상회.com/api/v1/",
    headers: {
        "Content-Type": "application/json",
        //Authorization: localStorage.getItem("accessToken"),
    },
});

export default urlAxios;
