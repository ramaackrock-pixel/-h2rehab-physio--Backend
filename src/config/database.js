import mongoose from 'mongoose'

const connectDB = async () => {
    try {

        const uri = `${process.env.MONGODB_URI}`;
        console.log(`Connecting to MongoDB at: ${uri.replace(/:([^@]+)@/, ":****@")}`);
        const connectionInstance = await mongoose.connect(uri, {
            connectTimeoutMS: 10000,
            family: 4 // Force IPv4 to avoid DNS resolution issues
        })
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log(error);
        process.exit(1)
    }

}

export default connectDB;