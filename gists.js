(function () {

    window.addEventListener("load", function () {
        var favorites = getFavorites();
        var favoritesListNode = document.getElementById("favorite-gists");
        var gistIds = Object.keys(favorites);

        for (var i = 0; i < gistIds.length; i++) {
            var gistId = gistIds[i];
            var gistAttributes = favorites[gistId];
            addGistToList(gistAttributes, favoritesListNode, true);
        }
    });

    var searchForm = document.getElementById("search-form");

    searchForm.addEventListener("submit", function (event) {
        // clear out old search results
        var gists = document.getElementById("available-gists");
        gists.innerHTML = "";

        var pages = parseInt(this["pages"].value);
        var languages = selectedLanguages(this);

        // request each page in parallel
        for (var i = 1; i <= pages; i++) {
            requestPage(i, languages);
        }

        event.preventDefault();
        return false;

    });

    function selectedLanguages(form) {
        var checkedBoxes = form["language"];
        var storedLanguages = [];
        var i;
        for (i = 0; i < checkedBoxes.length; i++) {
            if (checkedBoxes[i].checked) {
                storedLanguages.push(checkedBoxes[i].value);
            }
        }

        if (storedLanguages.length === 0) {
            for (i = 0; i < checkedBoxes.length; i++) {
                storedLanguages.push(checkedBoxes[i].value);
            }
        }
        return storedLanguages;
    }


    function requestPage(page, languages) {
        var httpRequest = createHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    var parsedJSON = JSON.parse(httpRequest.responseText);
                    displayGists(parsedJSON, languages);
                } else {
                    alert('There was a problem with the request :(');
                }
            }
        };
        httpRequest.open("GET", "https://api.github.com/gists?page=" + page);
        httpRequest.send();
    }

    function getFavorites() {
        var stringifiedFavorites = localStorage.getItem("favorite-gists");
        var favorites;

        if (stringifiedFavorites === null) {
            favorites = {};
        } else {
            favorites = JSON.parse(stringifiedFavorites);
        }

        return favorites;
    }

    function setFavorites(favorites) {
        localStorage.setItem("favorite-gists", JSON.stringify(favorites));
    }

    function addGistToList(gistAttributes, listNode, checked) {
        var description = gistAttributes.description;

        if (description === null || description.length === 0) {
            description = "(NO DESCRIPTION)";
        }

        var gistDescription = document.createTextNode(description);

        var gistLink = document.createElement("a");
        gistLink.href = gistAttributes.html_url;
        gistLink.appendChild(gistDescription);

        var listItem = document.createElement("li");
        listItem.id = gistAttributes.id;

        var favoriteCheckbox = document.createElement("input");

        favoriteCheckbox.type = "checkbox";
        favoriteCheckbox.checked = checked;
        favoriteCheckbox.name = "favorite";
        favoriteCheckbox.value = gistAttributes.id;

        favoriteCheckbox.addEventListener("change", function (event) {
            var listItem = this.parentNode;
            var currentList = listItem.parentNode;

            currentList.removeChild(listItem);
            var newList;
            var favorites = getFavorites();

            if (this.checked) {
                favorites[gistAttributes.id] = {
                    description: gistAttributes.description,
                    id: gistAttributes.id,
                    html_url: gistAttributes.html_url
                };
                newList = document.getElementById("favorite-gists");
            } else {
                delete favorites[gistAttributes.id];
                newList = document.getElementById("available-gists");
            }
            setFavorites(favorites);

            newList.appendChild(listItem);
        });

        listItem.appendChild(favoriteCheckbox);
        listItem.appendChild(gistLink);
        listNode.appendChild(listItem);
    }

    function displayGists(parsedJSON, languages) {
        var gists = document.getElementById("available-gists");
        var favorites = getFavorites();
        var favoiteIds = Object.keys(favorites);

        for (var i = 0; i < parsedJSON.length; i++) {
            var gistJSON = parsedJSON[i];
            var gistFiles = gistJSON["files"];
            var fileName;
            var fileNames = Object.keys(gistFiles);
            var languagePresent = false;

            for (var j = 0; j < fileNames.length; j++) {
                fileName = fileNames[j];
                var fileLanguage = gistFiles[fileName]["language"];
                if (languages.indexOf(fileLanguage) != -1) {
                    languagePresent = true;
                    break;
                }
            }

            if (!languagePresent) {
                continue;
            }

            if (favoiteIds.indexOf(gistJSON.id) !== -1){
                continue;
            }

            addGistToList(gistJSON, gists, false);
        }
    }

    function createHttpRequest() {
        var httpRequest;

        if (window.XMLHttpRequest) { // Mozilla, Safari, ...
            httpRequest = new XMLHttpRequest();
        } else if (window.ActiveXObject) { // IE
            try {
                httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (e) {
                try {
                    httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (e) {
                }
            }
        }

        return httpRequest;
    }


})();

