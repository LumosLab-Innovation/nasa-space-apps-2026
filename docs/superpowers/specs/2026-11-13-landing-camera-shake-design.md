# Gentle landing camera shake

Approved in conversation: A, light shake below 20 m, a slightly stronger contact impulse, settling within 0.8–1.2 seconds. User explicitly requested implementation and will do visual QA. No clips or screenshots.

Alternatives: A combines thrust-weighted near-ground vibration and contact emphasis (selected); B only shakes on contact (less engine feedback).

Use a bounded camera-plane translation around the existing chase target. Restore existing alpha, beta, radius and FOV; HUD remains in its current independent GUI. Maximum near-ground amplitude 0.14 m; contact accent up to 0.32 m, eased in and completely gone by 1.1 seconds. Time only advances with the unpaused landing update. Reset on retry/bridge; failed landing has no extra shake. Physics, assets and other cameras remain untouched.
