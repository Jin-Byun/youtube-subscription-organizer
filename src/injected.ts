(function () {
  const { fetch: FETCH } = window;
  window.fetch = async (...args) => {
    const res = await FETCH(...args);
    if (args.length === 1) {
      const req = args[0] as Request;
      if (
        req.url !== undefined &&
        req.url.startsWith("https://www.youtube.com/youtubei/v1/subscription/")
      ) {
        const data = await res.clone().json();
        console.log("response", data);
      }
    }
    return res;
  };
})();
