let url = `https://yts.mx/api/v2/list_movies.json`;

const btn = document.getElementById("btn");
const search = document.getElementById("search");

btn.addEventListener("click", () => {
    getMovies(`${url}?query_term=${search.value}`);
});
async function getMovies(params) {
    const res = await fetch(params);

    if (res.ok && res.status === 200) {
        const data = await res.json();
        viewData(data);
    }
}

getMovies(url);

const main = document.getElementById("main");

function viewData(data) {
    main.textContent = "";
    data.data.movies.map((item) => {
        const card = document.createElement("div");
        card.classList.add("card");

        const img = document.createElement("img");
        img.src = item.large_cover_image;
        img.alt = item.title;
        img.classList.add("card-img-top");

        const cardbody = document.createElement("div");
        cardbody.classList.add("card-body");

        const title = document.createElement("h3");
        title.classList.add("card-title");
        title.textContent = item.title;

        const text = document.createElement("p");
        text.classList.add("card-text");
        text.textContent = item.year;

        card.appendChild(img);
        cardbody.appendChild(title);
        cardbody.appendChild(text);

        card.appendChild(cardbody);

        main.appendChild(card);
    });
}
