import {asyncHandler} from "../utils/asyncHandler.js";
import{ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessRefreshTokens=async(userId) =>{
  try{
    const user =await User.findById(userId)
    const accessToken =user.generateAccessToken()
    const refreshToken =user.generateRefreshToken()


    user.refreshToken =refreshToken
       await user.save({validateBeforeSave: false})

       return {accessToken,refreshToken}


  }catch(error){
   throw new ApiError(500,"something went wrong")
  }
}
const registerUser =asyncHandler( async (req,res)=>{

    const {fullname,email,username,paaword}=req.body
    console.log("email:",email);

    if(
        [fullname,email,username,paaword].some((feild)=>
        feild?.trim()==="")
        
        
        
    
    ){
       
      throw new ApiError(400, "All feilds are required")

    }

   const existedUser=  await User.findOne({
        $or :[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

   const avatarLocalPath= req.files?.avatar[0]?.path;
   // const coverImagePath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&  req.files.coverImage.length >0){
      coverImageLocalPath=req.files.coverImage[0].path

    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
     const avatar = await  uploadOnCloudinary(avatarLocalPath)
      const coverImage= await uploadOnCloudinary(coverImagePath)


      if(!avatar){
        throw new ApiError(400,"Avatar file is required")
      }
      const user=User.create({
        fullNme,
        avatar :avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
      })

       const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
       )

       if(createdUser){

        throw new ApiError(500,"something went wrong whileregistring user")
       }

       return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
       )
    




})
//get user detail from frontend 
//validation kahi empty tho nahi bhej diya
//check if user already exsist-sabse easy email se check kar lo ya user name se
//check for images
//check for avatar
//upload them to cloudinary,avatar
//create user object -create entry in db
//remove password and refresh token feild from response 
//check for user creation
//return res 
const loginUser  =asyncHandler (async (req,res)=>{
  // req bodu->data
  //username
  //find the user 
  //password check
  //access and refresh token
  //send cookies

  const{email,username,password}= req.body
  if(!username|| !email){
    throw new ApiError(400,"username or email  is required")
  }
  const user  =await  User.findOne({
   $or:[{username},{email}]


   })
   if(!user){
    throw new ApiError(400,"user does not exsist")
   }
    
    const isPasswordValid =await user.isPasswordCorrect(password)
     if(!isPasswordValid){
    throw new ApiError(400,"invalid user credentials")

   }
     const {accessToken,refreshToken} = await  generateAccessRefreshTokens(user._id)

     const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

     const options= {
      httpOnly : true,
      secure :true

     }
     return res
     .status(200)
     .cookie("access Token ",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
      new ApiResponse(
        200,
        {

        user:loggedInUser,AccessToken,
        refreshToken

        }
      )



     )



})








export {registerUser,

}
