import mongoose from "mongoose";

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let DB_URI = "";

  if (process.env.NODE_ENV === "production") {
    DB_URI = process.env.DB_URI!;
  } else DB_URI = process.env.DB_LOCAL_URI!;

  await mongoose.connect(DB_URI); // use this to check connection success or not .then((con) => console.log("DB Connected"));
};

export default dbConnect;
