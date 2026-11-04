// Central place for the live-stream source.
//
// `youtube.com/embed/live_stream?channel=<CHANNEL_ID>` always plays
// whatever that channel currently has live — so once you drop in your
// real channel ID here, both the sticky mini player and the "LIVE"
// modal automatically show whatever you're streaming, with no further
// code changes.
//
// Replace this with your channel's ID (Studio → Settings → Channel →
// Advanced settings), e.g. "UCxxxxxxxxxxxxxxxxxxxxxx".
export const LIVE_CHANNEL_ID = "REPLACE_WITH_YOUR_YOUTUBE_CHANNEL_ID";

export const liveEmbedUrl = (opts: { mute: boolean }) =>
  `https://www.youtube.com/embed/live_stream?channel=${LIVE_CHANNEL_ID}` +
  `&autoplay=1&mute=${opts.mute ? 1 : 0}&playsinline=1&rel=0`;
