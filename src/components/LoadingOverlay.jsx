// src/components/LoadingOverlay.jsx
import { Loader, Center, Overlay } from "@mantine/core";

export default function LoadingOverlay() {
  return (
    <Overlay blur={2} center>
      <Center style={{ height: "100vh" }}>
        <Loader type="bars" size="xl" />
      </Center>
    </Overlay>
  );
}
