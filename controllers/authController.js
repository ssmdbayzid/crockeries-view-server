const  jwt = require("jsonwebtoken");
const User = require("../Schema/UserSchema");
const bcrypt = require('bcrypt'); 


exports.register = async(req, res) =>{
    try {

        const  user = await User.findOne({email: req.body.email})
        if(user) return res.status(403).json({success: false, message: "Already have an account"})
        
        const saltRounds = 10; 

         // Hash the password before storing it
         const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const newUser = await User.create({...req.body, password: hashedPassword})
      
        return res
        .status(200).json({success:true, message: "Join success", user:newUser})
    } catch (error) {
        return res        
        .status(500).json({success:false, message: error?.message})
    }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(403).json({ message: "Account does not exist" });

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched)
      return res.status(400).json({ message: "Invalid credentials" });

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    // Access token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "15m",
    });

    res.cookie('accessToken', accessToken,{
      maxAge: 15 * 60 * 1000,
      httpOnly: true,  
      secure: false, // for production true
      sameSite: 'lax' // for production 'none'
    })


    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
      // expiresIn: "7d",
    });
      res.cookie('refreshToken', refreshToken,{
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days       
      httpOnly: true,  
      secure: false, // for production true
      sameSite: 'lax' // for production 'none'            
    })

    return res.status(200).json({
      success: true,
      message: "Login successful",
      // token: accessToken, // accessToken only, refreshToken is in cookie
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: 'lax', // use 'none' in production with https
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: 'lax', // use 'none' in production with https
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  
  if (!token) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1m" }
    );

       res.cookie('accessToken', newAccessToken,{
      maxAge: 1 * 60 * 1000,
      httpOnly: true,  
      secure: false, // for production true
      sameSite: 'lax' // for production 'none'
    })

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};


exports.googleLogin = async (req, res) =>{
    try {      
        const user =  await User.findOne({email: req.body.email})
        .populate({
            path: 'booking',           
            populate: {
                path: 'property',
                model: 'Properties'
            }
        });
        if(user){
        const accessToken =  jwt.sign(user.email, process.env.JWT_SECRET_KEY);  
        return res
        .status(200).json({sucess: true, message: "Log In  success full", user: user, token:accessToken})
        }else{
            const newUser = await User.create(req.body);
            const accessToken =  jwt.sign(user.email, process.env.JWT_SECRET_KEY);     
            return res
             .status(200).json({sucess: true, message: "Log In  success full", user: newUser, token:accessToken})           
        }                      
    } catch (error) {
        return res
        .status(500).json({sucess: false, message: error.message})  
    }
}

exports.getSingleUser = async(req, res)=>{
    try {
        const id = req.params.id;
        const user =  await User.findById(id)
        .populate({
            path: 'booking',
            populate: {
                path: 'property',
                model: 'Properties'
            }
        })
        .populate('my_properties');
        return res
        .status(200).json({sucess: true, message: "Log In  success full", data: user})   
    } catch (error) {
        return res
        .status(500).json({sucess: false, message: error.message})  
    }
 

}

exports.getAllUser = async(req, res)=>{
    try {
        const users = await User.find()     

    return res
    .status(200).json({sucess: true, message: "Log In  success full", data: users})   
}
     catch (error) {
        return res
        .status(500).json({sucess: false, message: error.message})  
    }
}








/*

------------- Login ---------------
exports.login = async (req, res) => {
  try {

    console.log("llllog in", req.body)
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Don't have account, please join",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Email or password is invalid",
      });
    }

    // JWT payload
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role, // Ensure your User model has a `role` field
    };

    // Sign the token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: '30s', // adjust as needed
    });

    // Refresh  token
     const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "5m",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {role: user.role, email: user.email},
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

---------------------- Refresh Token ---------------
exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  
  if (!token)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};
*/