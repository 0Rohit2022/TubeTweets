import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //Get User Details From Frontend
  //Validation - Not Empty
  //Check If user is already exist or not via: username , email.
  // Check for the images, Check for the avatar.
  // Upload them to cloudinary, avatar
  // Create UserObject - Create entry in DATABASE
  // Remove Password and refresh token field from response
  // Check for userCreation
  // return response

  const { username, fullname, email, password } = req.body;
  console.log("username : ", req.body.username);
  console.log("email : ", email);
  console.log("fullname : ", fullname);
  console.log("password : ", password);

  //Validation
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are compulsory");
  }

  //Check if User is already exists or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  //Check for images or avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //Upload Them to cloudinary , avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is not uploaded");
  }

  // Create UserObject - Create entry in DATABASE

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //Remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //Checking for User Creation {Check If User is created or not}

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  //And, Now Return the response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //Get the data from the req.body
  //Check which way you gonna logged in via username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  //Get the data from the req.body
  const { username, email, password } = req.body;
  console.log(username);
  console.log(email);
  console.log(password);

  //Logged in via username or email
  if (!(username || email)) {
    throw new ApiError(400, "Username or Password is required");
  }

  //Find the User
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //Check the password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }

  //Refresh and Access Tokens
  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in SuccessFully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,//This will remove the selected field from the document.
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const icomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!icomingRefreshToken) {
      throw new ApiError(401, "UnAuthorized Request");
    }

    const deCodedToken = Jwt.verify(
      icomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(deCodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (icomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expiered or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessTokenandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newrefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // req.user?._id Getting user id from the req.user which is a middleware inside the auth.middleware.js
    const user = await User.findById(req.user?._id);
    const isPasswordCorrectOrNot = user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrectOrNot) {
      throw new ApiError(400, "Invalid Old Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Password Didn't Changed");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current User Fetched Successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, username, email } = req.body;

  if (!(fullname || email || username)) {
    throw new ApiError(400, "All Fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
        username,
      },
    },
    {
      new: true,
    }
  ).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },

        isSubscribed : {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true, 
            else : false
          }
        }
      },
    },
    {
      $project: {
        fullname : 1,
        username : 1,
        subscribersCount: 1,
        channelsSubscribedToCount:1,
        isSubscribed : 1,
        avatar : 1,
        coverImage : 1,
        email : 1,
      }
    }
  ]);


  console.log(channel);

  if(!channel?.length)
  {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User Channel fetched Successfully!!")
  )
});

const getWatchedHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    }, 
    {
      $lookup : {
        from : "video",
        localField: "watchHistory",
        foreignField : "_id",
        as: "watchHistory",
        pipeline : {
          $lookup : {
            from : "user",
            localField: "owner",
            foreignField: "_id",
            as : "owner",
            pipeline : [
              {
                $project: {
                  fullname : 1,
                  username : 1,
                  avatar : 1
                }
              },
              {
                $addFields: {
                  owner : {
                    $first: "$owner"
                  }
                }
              }
            ]
          }
        }
      }
    }
  ]);

  return res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully")
  )
})

export {
  getWatchedHistory,
  updateUserCoverImage,
  updateUserAvatar,
  updateAccountDetails,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
};
