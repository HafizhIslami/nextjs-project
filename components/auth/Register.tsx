"use client";

import { useRegisterMutation } from "@/redux/api/authApi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, {
  ChangeEventHandler,
  FormEvent,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import ButtonLoader from "../layout/ButtonLoader";

const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const router = useRouter();

  const { name, email, password } = user;

  const [register, { isLoading, error, isSuccess }] = useRegisterMutation();

  useEffect(() => {
    if (error && "data" in error) {
      // const customError = error.data as CustomError;
      toast.error((error.data as { errMessage: string })?.errMessage);    }

    if (isSuccess) {
      router.push("/login");
      toast.success("Registration successful. You can login now");
    }
  }, [error, isSuccess, router]);

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userData = {
      name,
      email,
      password,
    };

    register(userData);
  };
  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // const submitHandler = async (formData: FormData) => {
  //   console.log(formData);
  //   const res = await registerUser(formData);
  //   console.log("res",res);
  //   if (res?.error) return toast.error(res?.error);

  //   if (res?.isCreated) {
  //     router.push("/login");
  //     toast.success("Account Registered. You can login now");
  //   }
  // };

  return (
    <div className="wrapper">
      <div className="col-10 col-lg-5">
        <form className="shadow rounded bg-body" onSubmit={submitHandler}>
          <h2 className="mb-4">Join Us</h2>

          <div className="mb-3">
            <label htmlFor="name_field" className="form-label">
              {" "}
              Full Name{" "}
            </label>
            <input
              type="text"
              id="name_field"
              className="form-control"
              name="name"
              value={name}
              onChange={onChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="email_field">
              {" "}
              Email{" "}
            </label>
            <input
              type="email"
              id="email_field"
              className="form-control"
              name="email"
              value={email}
              onChange={onChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-3 password-field">
              <label className="form-label" htmlFor="password_field">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password_field"
                className="form-control"
                name="password"
                value={password}
                onChange={onChange}
                autoComplete="new-password"
                minLength={6}
                aria-describedby="password_help"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              <div className="form-text" id="password_help">
                Use at least 6 characters.
              </div>
            </div>

          {/* <SubmitButton text="Register" className="btn form-btn w-100 py-2" /> */}
          <button type="submit" className="btn form-btn w-100 py-2" disabled={isLoading}>
            {isLoading ? <ButtonLoader /> : "Register"}
          </button>
          <p className="auth-switch-link">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;

