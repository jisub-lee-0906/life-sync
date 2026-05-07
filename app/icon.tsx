import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, rgb(243, 237, 224), rgb(214, 239, 233))",
          color: "rgb(37, 49, 76)",
          display: "flex",
          fontSize: 164,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.08em",
          width: "100%",
        }}
      >
        LS
      </div>
    ),
    size,
  );
}
