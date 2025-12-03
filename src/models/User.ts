import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string; // facultatif pour Google
  provider: string;
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },

  // password devient optionnel
  password: { type: String, required: false },

  // on marque si c’est Google ou Credentials
  provider: { type: String, default: "credentials" },
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);


export default User;
