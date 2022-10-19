import "./App.css";
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "./firebase";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";

const API_ENDPOINT = process.env.REACT_APP_FIREBASE_FUNCTIONS;

function App() {
  const [credentials, setCredentials] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  onAuthStateChanged(auth, (credentials) => setCredentials(credentials));
  useEffect(() => {
    async function getData() {
      try {
        const response = await fetchUserInfo();
        const data = await response.json();
        setUserInfo({ ...userInfo, ...data, phone: credentials?.phoneNumber });
      } catch (error) {
        console.log(error);
      }
    }
    getData();
    return;
  }, []);
  useEffect(() => {
    setUserInfo({ ...userInfo, phone: credentials?.phoneNumber });
  }, [credentials]);
  return (
    <main className="App">
      <h1>Kwitter</h1>
      {credentials && userInfo ? (
        <Profile userInfo={userInfo} />
      ) : (
        <Auth setCredentials={setCredentials} />
      )}
    </main>
  );
}

function fetchUserInfo() {
  const options = {
    method: "POST",
    body: JSON.stringify({
      phone: "+46762500502",
    }),
  };
  return fetch(API_ENDPOINT + "/getUserInfo", options);
}
function updateUserInfo(data: any) {
  const options = {
    method: "POST",
    body: JSON.stringify(data),
  };
  return fetch(API_ENDPOINT + "/updateUserInfo", options);
}
function Profile({ userInfo }: any) {
  const [isInputValid, setIsInputValid] = useState(true);
  const [name, setName] = useState(userInfo?.name);
  const [email, setEmail] = useState(userInfo?.email);

  async function handleSubmit() {
    try {
      await updateUserInfo({
        phone: userInfo?.phone,
        name,
        email,
      });
    } catch (error) {
      console.log(error);
    }
  }
  function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    handleSubmit();
  }
  return (
    <div>
      <h2>Change Information</h2>
      <form>
        <label htmlFor="">name</label>
        <input
          type="text"
          value={name}
          name="name"
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="email">email</label>
        <input
          type="email"
          value={email}
          name="email"
          onChange={(e) => {
            setEmail(e.target.value);
            setIsInputValid(isEmailValidFormat(e.target.value.trim()));
          }}
        />
        {!isInputValid && <span>input is not valid</span>}
        <button onClick={onSubmit} disabled={!isInputValid}>
          Save
        </button>
      </form>
    </div>
  );
}
function Auth({ setCredentials }: { setCredentials: any }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(true)
  const [appVerifier, setAppVerifier] = useState(window.recaptchaVerifier);

  useEffect(() => {
    setAppVerifier(window.recaptchaVerifier);
  }, []);

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "sign-in-button",
      {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          onCaptchaSuccess();
        },
      },
      auth
    );
  }, []);

  async function onCodeSubmit(code: any) {
    try {
      const result = await window.confirmationResult.confirm(code);
      setCredentials(result.user);
    } catch (error) {
      console.log(error);
    }
  }
  function onCaptchaSuccess() {
    console.log("onCaptchaSuccess");
  }
  async function onPhoneSubmit() {
    try {
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      window.confirmationResult = result;
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <h2>Sign In</h2>
      <label htmlFor="phone">phone</label>
      <input
        type="tel"
        name="phone"
        onChange={(e) => {
			setPhoneNumber(e.target.value)
			setIsPhoneNumberValid(isPhoneNumberValidation(e.target.value.trim()))
		}}
        id="phone"
      />
	  <span>valid format example(+46760000000)</span>
      <button disabled={!isPhoneNumberValid} onClick={onPhoneSubmit} id="sign-in-button">
        get code
      </button>
      <label htmlFor="code">code</label>
      <input
        type="number"
        name="code"
        onChange={(e) => setCode(e.target.value)}
        id="code"
      />
      <button disabled={!isPhoneNumberValid} onClick={() => onCodeSubmit(code)} id="auth-code">
        auth with code
      </button>
    </>
  );
}
interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export default App;

function isEmailValidFormat(email: string) {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

function isPhoneNumberValidation(phoneNumber: string)
{
  return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phoneNumber)
}