const mongoose = require("mongoose");

main().catch((err) => console.log(err));

async function main() {
  mongoose.set("strictQuery", false);
  await mongoose.connect(
    // `mongodb+srv://re_cv_server:1234@cluster0.vruq0.mongodb.net/play_cv`
    `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.vruq0.mongodb.net/play_cv`
  );
  console.log("mongo connect");
}
