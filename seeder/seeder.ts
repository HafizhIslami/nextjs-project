import Room from "../backend/models/room";
import mongoose from "mongoose";
import { rooms } from "./dataAI";

const seedRooms = async () => {
  try {
    let DB_URI = "";

    if (process.env.NODE_ENV === "production") {
      DB_URI = process.env.DB_URI!;
    } else DB_URI = process.env.DB_LOCAL_URI!;

    console.log(`process running in ${process.env.NODE_ENV} mode`);
    await mongoose.connect(DB_URI);

    await Room.deleteMany();
    console.log("Rooms are deleted");

    // insert collections of rooms directly
    // await Room.insertMany(rooms);
    // console.log("Rooms are added");

    // insert each room by passing room's construction then save it
    for (const room of rooms) {
      const newRoom = new Room(room); // Create a new instance of the Room model
      await newRoom.save(); // This will trigger the pre-save hook
    }
    console.log("Rooms are added");

    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

seedRooms();
