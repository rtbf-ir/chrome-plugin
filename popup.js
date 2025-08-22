const DATA_URL = "https://rtbf.ir/data/data.json";

const DIFFICULTY_COLORS = {
  "impossible-label": "#000000",
  "hard-label": "#a32100",
  "easy-label": "#129141",
  "medium-label": "#ffa800",
};

const DIFFICULTY_IMAGES = {
  "impossible-label": "/assets/images/d_impossible_logo.png",
  "hard-label": "/assets/images/d_hard_logo.png",
  "easy-label": "/assets/images/d_easy_logo.png",
  "medium-label": "/assets/images/d_medium_logo.png",
};

function changeIcon(difficulty, tabId) {
  chrome.action.setIcon({ path: DIFFICULTY_IMAGES[difficulty], tabId });
}

function hideSpinner() {
  document.querySelector(".spinner-container").style.display = "none";
}

function showDifficulty(item, tabId) {
  const {
    difficulty: difficultyLabel,
    keytype: difficulty,
    info,
    deleteurl,
    name,
  } = item;

  changeIcon(difficulty, tabId);

  document.querySelector(".difficulty-text").innerText = difficultyLabel;
  document.querySelector(".difficulty-text").style.backgroundColor =
    DIFFICULTY_COLORS[difficulty];
  document
    .querySelector(".difficulty-info")
    .insertAdjacentHTML("afterbegin", info);

  if (deleteurl !== "#") {
    document.querySelector(".remove-button").style.display = "block";
    document.querySelector(".remove-button").href = "https://" + deleteurl;
  }

  document.querySelector(".service-name").innerText = 'در "' + name + '"';

  hideSpinner();

  document.querySelector(".difficulty-container").style.display = "flex";
}

function showNotSupported() {
  hideSpinner();
  document.querySelector(".not-supported-container").style.display = "block";
}

function getDomainParts(hostname) {
  return hostname.split('.').reverse();
}

function isSubdomainMatch(currentDomain, websiteDomain) {
  const currentParts = getDomainParts(currentDomain);
  const websiteParts = getDomainParts(websiteDomain);

  // Website should have equal or fewer parts than current domain
  if (websiteParts.length > currentParts.length) return false;

  // Check if all parts of website domain match with current domain from right to left
  for (let i = 0; i < websiteParts.length; i++) {
    if (websiteParts[i] !== currentParts[i]) return false;
  }

  return true;
}

chrome?.tabs?.query(
  {
    active: true,
    lastFocusedWindow: true,
  },
  function (tabs) {
    const currentUrl = tabs[0].url;
    const urlObj = new URL(currentUrl);
    const domain = urlObj.hostname;

    const tabId = tabs[0].id;

    fetch(DATA_URL)
      .then((response) => response.json())
      .then((websites) => {
        for (let item of websites) {
          if (isSubdomainMatch(domain, item.website)) {
            showDifficulty(item, tabId);
            return;
          }
        }

        showNotSupported();
      })
      .catch((error) => {
        console.error(
          "There has been a problem with fetch websites data:",
          error
        );
      });
  }
);

document.addEventListener("DOMContentLoaded", function () {
  var closeButton = document.getElementById("closeButton");
  closeButton.addEventListener(
    "click",
    function () {
      window.close();
    },
    false
  );
});
