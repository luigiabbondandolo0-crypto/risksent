export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertServerSecretsNotLeakedToPublicEnv } = await import("@/lib/security/deployEnv");
    assertServerSecretsNotLeakedToPublicEnv();

    process.on("unhandledRejection", (reason) => {
      const msg = reason instanceof Error ? reason.message : String(reason);
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "process.unhandledRejection",
          message: msg
        })
      );
    });
  }
}
