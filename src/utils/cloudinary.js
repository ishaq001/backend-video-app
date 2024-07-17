import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// IMPORTANT NOTE =>

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});
// https://cloudinary.com/documentation/upload_assets_in_node_tutorial
// UPLOAD IMAGE TO CLOUDINARY
const uploadOnCloudinary = async (localFilePath) => {
	try {
		if (!localFilePath) return null;
		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
		});
		console.log("file is uploaded successfully");
		fs.unlinkSync(localFilePath);
		return response;
	} catch (error) {
		console.log("CLOUDINARY ERROR", error);
		fs.unlinkSync(localFilePath);
		return null;
	}
};

// LINK ==> https://cloudinary.com/documentation/deleting_assets_tutorial
// DELETE IMAGE FROM CLOUDINARY
const deleteFromCloudinary = async (publicId) => {
	try {
		if (!publicId) return null;
		const response = await cloudinary.uploader.destroy(publicId, {
			resource_type: "auto", // for delete cached image url
			// authenticated: true // only for authenticated files
			invalidate: true,
		});
		return response;
	} catch (error) {
		console.log("FILE NOT DELETED FROM CLOUDINARY", error.message);
	}
};

// DELTE MULTIPLE RESOURCES
const deleteMultipleFIle = async (arrayofPublicIdsOfFiles) => {
	// for deleting multiple files you need to hit the main api not the uploader api
	const response = await cloudinary.api.delete_resources(
		arrayofPublicIdsOfFiles
	);
};

export { uploadOnCloudinary, deleteFromCloudinary };
