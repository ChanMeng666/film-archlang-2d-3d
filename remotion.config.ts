import { Config } from "@remotion/cli/config";

// One heavy process at a time on this laptop: two render threads, JPEG frames, H.264 + AAC.
Config.setConcurrency(2);
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
