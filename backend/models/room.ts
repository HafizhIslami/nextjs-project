import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user";
import geoCoder from "../utils/geoCoder";

export interface IImage extends Document {
  public_id: string;
  url: string;
}

export interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
}

export interface ILocation {
  type: string;
  coordinates: number[];
  formattedAddress: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface IRoom extends Document {
  merchantId?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  pricePerNight: number;
  address: string;
  location: ILocation;
  guestCapacity: number;
  numOfBeds: number;
  isInternet: boolean;
  isBreakfast: boolean;
  isAirConditioned: boolean;
  isPetsAllowed: boolean;
  isRoomCleaning: boolean;
  ratings: number;
  numOfReviews: number;
  images: IImage[];
  category: string;
  reviews: IReview[];
  user: IUser;
  createdAt: Date;
}

const roomSchema: Schema<IRoom> = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
    required: false,
    index: true,
  },
  name: {
    type: String,
    required: [true, "Please enter room name"],
    trim: true,
    maxLength: [200, "Room name cannot exceed 100 char"],
  },
  description: {
    type: String,
    required: [true, "Please enter room description"],
  },
  pricePerNight: {
    type: Number,
    required: [true, "Please enter room price"],
    maxLength: [4, "Room name cannot exceed 4 characters"],
    default: 0.0,
  },
  address: {
    type: String,
    required: [true, "Please enter room address"],
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    formattedAddress: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  guestCapacity: {
    type: Number,
    required: [true, "Please enter room guest capacity"],
  },
  numOfBeds: {
    type: Number,
    required: [true, "Please enter room guest capacity"],
  },
  isInternet: {
    type: Boolean,
    default: false,
  },
  isBreakfast: {
    type: Boolean,
    default: false,
  },
  isAirConditioned: {
    type: Boolean,
    default: false,
  },
  isPetsAllowed: {
    type: Boolean,
    default: false,
  },
  isRoomCleaning: {
    type: Boolean,
    default: false,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "Please enter room category"],
    enum: {
      values: ["King", "Single", "Twins"],
      message: "Please select correct category for room",
    },
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

roomSchema.index({ merchantId: 1, category: 1 });
roomSchema.index({ merchantId: 1, createdAt: -1 });

roomSchema.pre("save", async function () {
  if (!this.isModified("address")) {
    return;
  }

  const loc = await geoCoder.geocode(this.address);

  if (!loc?.[0]?.longitude || !loc?.[0]?.latitude) {
    throw new Error("Unable to geocode room address");
  }

  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress ?? this.address,
    city: loc[0].city ?? "",
    state: loc[0].stateCode ?? "",
    zipcode: loc[0].zipcode ?? "",
    country: loc[0].countryCode ?? "",
  };
});

export default mongoose.models.Room ||
  mongoose.model<IRoom>("Room", roomSchema);
