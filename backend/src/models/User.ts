import mongoose, { Schema } from "mongoose";

export interface UserType extends Document {
  username: string;
  email: string;
  password: string;
  googleId?: string;
  createAt: Date;
  updateAt: Date;
}
const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      match: [
        /^(?=.{8,30}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._' ]+(?<![_.])$/,
        "Username invalid, it should contain 8-30 characters including alphanumeric letters, spaces, apostrophes, and be unique!",
      ],
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<UserType>("User", UserSchema);

export default User;
