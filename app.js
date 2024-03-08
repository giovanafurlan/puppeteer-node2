const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
const port = 3001;

// Rota para fazer a chamada de API
app.get("/api", async (req, res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-features=site-per-process",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const parametro = req.query.parametro;

    if (!parametro) {
      return res.status(400).json({ error: "Parâmetro não fornecido" });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(parametro, { waitUntil: "networkidle2" }); // aumentando para 60 segundos (60000 milissegundos)

    // pega título
    let title = await page.title();
    // botão fecha modal
    await page.click("button.modal__dismiss");

    // pega conteúdo sobre
    // await page.waitForSelector(".core-section-container__content");
    // let elementSobre = await page.$(".core-section-container__content");
    // let sobre = await page.evaluate((el) => el.textContent, elementSobre);

    // pega conteúdo sobre
    const sobre = await page.evaluate(() => {
      const span = document.querySelector(".core-section-container__content");
      if (span) {
        return span.textContent.trim();
      }
      return null;
    });

    // pega conteúdo função
    const funcao = await page.evaluate(() => {
      const span = document.querySelector(".top-card-layout__headline");
      if (span) {
        return span.textContent.trim();
      }
      return null;
    });

    const localizacao = await page.evaluate(() => {
      const span = document.querySelector(
        "div.not-first-middot span:first-child"
      );
      if (span) {
        return span.textContent.trim();
      }
      return null;
    });

    const experiencias = await page.evaluate(() => {
      const experienceItems = document.querySelectorAll(
        'section[data-section="experience"] .experience-item'
      );
      const experiencesArray = [];

      experienceItems.forEach((item) => {
        const empresa = item
          .querySelector(".experience-item__subtitle")
          .textContent.trim();
        const duracao = item.querySelector(".date-range").textContent.trim();
        const localizacao = item
          .querySelectorAll(".experience-item__meta-item")[1]
          .textContent.trim();
        const descricao = item
          .querySelector(".show-more-less-text__text--less")
          .textContent.trim();

        experiencesArray.push({
          empresa,
          duracao,
          localizacao,
          descricao,
        });
      });

      return experiencesArray;
    });

    // Retornando a resposta como JSON
    res.json({ title, sobre, funcao, localizacao, experiencias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
