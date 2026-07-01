import jwt from "jsonwebtoken";

const jwtTokenGenerator = (userId)=>{
    try{
        const token = jwt.sign({userId},process.env.JWT_SECRET_KEY,{expiresIn:"10d"});
        return token;
    }
    catch(error){
        console.log(error);

    }
}

export default jwtTokenGenerator;
