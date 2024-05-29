import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

/**
 * @typedef VideoSchema
 * @description Schema for the Video collection in the database.
 * @property {String} videoFile - Cloudinary URL for the video file.
 * @property {String} thumbnail - Cloudinary URL for the video thumbnail.
 * @property {String} title - Title of the video.
 * @property {String} description - Description of the video.
 * @property {Number} duration - Duration of the video.
 * @property {ObjectId} owner - ID of the user who owns the video.
 * @property {Number} [views=0] - Number of views for the video. Defaults to 0.
 * @property {Boolean} [isPublished=true] - Whether the video is published. Defaults to true.
 * @property {Boolean} timestamps - Whether to automatically add createdAt and updatedAt fields.
 */

const videoSchema = new Schema(
	{
		videoFile: {
			type: String, //cloudinary url
			required: true,
		},
		thumbnail: {
			type: String, //cloudinary url
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		duration: {
			type: Number, // cloudinary url
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		views: {
			type: Number,
			default: 0,
		},
		isPublished: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

/**
 * @function addAggregatePaginatePlugin
 * @description Adds the mongoose-aggregate-paginate-v2 plugin to the Video schema.
 */
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model("Video", videoSchema);
