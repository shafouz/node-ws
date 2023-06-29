describe("basic functionality", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:8000");

    const form = await page.$("#message");
    await form.type("hello world");

    const button = await page.$("#sendMessage");
    await button.click();
  });

  it("send message", async () => {
    const obj = await page.evaluate(() => {
      const user = document.querySelector("#users");
      const messages = document.querySelector("#messages");

      return {
        user: user.children[0].textContent,
        user_len: user.children.length,
        message: messages.children[0].textContent,
        messages_len: messages.children.length,
      };
    });

    expect(obj.user.length).toEqual(16);
    expect(obj.user_len).toEqual(1);
    expect(obj.message.includes("hello world")).toEqual(true);
    expect(obj.messages_len).toEqual(1);

    const incognito = await browser.createIncognitoBrowserContext();
    const page2 = await incognito.newPage();
    await page2.goto("http://localhost:8000");
    const form2 = await page2.$("#message");
    await form2.type("hello world 2");
    const button2 = await page2.$("#sendMessage");
    await button2.click();

    const obj2 = await page2.evaluate(() => {
      const user = document.querySelector("#users");
      const messages = document.querySelector("#messages");

      return {
        user_len: user.children.length,
        messages_len: messages.children.length,
      };
    });

    expect(obj2.user_len).toEqual(2);
    expect(obj2.messages_len).toEqual(2);

    const users_page_1 = await page.$$("#users > b");
    expect(users_page_1.length).toEqual(2);
  });
});
