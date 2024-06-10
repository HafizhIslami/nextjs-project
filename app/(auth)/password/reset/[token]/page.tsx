import NewPassword from "@/components/user/NewPassword";
import React from "react";

export const metadata = {
  title: "Reset Password",
};

interface Props {
  params: { token: string };
}

const NewPasswordPage = ({ params }: Props) => {
  return (
    <>
      <NewPassword token={params?.token} />
    </>
  );
};

export default NewPasswordPage;
