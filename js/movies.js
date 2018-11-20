/*global MyMovies _config*/

var MyMovies = window.MyMovies || {};
var currentMovieList = null;
var myCurrentMovies = null;

var movieScope = (function moviesScopeWrapper($) {
  var currentPage = 1;
  var totalPages = 0;
  var totalMovies = 0;
  var myTotalMovies = 0;
  var moviesYear = 0;
  var authToken;
    MyMovies.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        }
        else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    $(function onDocReady() {
        $('#refreshMovies').click(handleMovieRefresh);
        $('#nextPage').click(handleMoviePaging);
        $('#addMovie').click(handleAddMovie);
        $('#saveMovie').click(handleSaveMovie);
        $('#deleteMovie').click(handleDeleteMovie);
        $('#signOut').click(function() {
            MyMovies.signOut();
            alert("You have been signed out.");
            window.location = "signin.html";
        });
        MyMovies.authToken.then(function updateAuthMessage(token) {
            if (token) {
                updateMenu();
                getMovies();
                getMyMovies();
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function requestAddMovie(movieIdx) {
        var movie = currentMovieList[movieIdx];
        var requestData = JSON.stringify(movie);
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/movies',
            headers: {
                Authorization: authToken
            },
            data: requestData,
            contentType: 'application/json',
            success: completeRequest,
            error: errorAddMovie,
        });
    }

    function errorAddMovie (jqXHR, textStatus, errorThrown) {
        console.error('Error saving movie: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        alert('An error occured when adding your movie:\n' + jqXHR.responseText);
    }

    function requestSaveMovie(movieIdx) {
        var valiData = false;
        var mrating = $('#rating').val();
        var mnotes = $('#notes').val() || ' ';
        var mlocation = $('#location').val() || ' ';
        var mcost = $('#cost').val();
        var mrecommend = $('#recommend').val() || 'N';
        valiData = validateInputData(mrating, mcost);
        if (!valiData) {
            myCurrentMovies[movieIdx].MovieContent.rating = mrating;
            myCurrentMovies[movieIdx].MovieContent.notes = mnotes;
            myCurrentMovies[movieIdx].MovieContent.location = mlocation;
            myCurrentMovies[movieIdx].MovieContent.cost = mcost;
            myCurrentMovies[movieIdx].MovieContent.recommend = mrecommend;
            var requestData = JSON.stringify(myCurrentMovies[movieIdx]);
            $.ajax({
                method: 'PUT',
                url: _config.api.invokeUrl + '/movies',
                headers: {
                    Authorization: authToken
                },
                data: requestData,
                contentType: 'application/json',
                success: completeRequest,
                error: errorSaveMovie,
            });
        }
        else {
            alert (valiData);
        }
    }

    function validateInputData (rating, cost, recommend) {
        var returnValue = null;
        var myRating = parseInt(rating);
        var myCost = parseFloat(cost);
        var myRecommendation = recommend;
        if (myRating < 1 || myRating > 5)
            returnValue = 'Invalid rating. The value must be between 1 and 5.';
        else if (myCost < 0 || myCost > 99.99)
            returnValue = 'Invalid cost. The value cannot exceed $99.99.';
        else {
            if (myRecommendation != 'Y' && myRecommendation != 'N')
                returnValue = 'Invalid. Recommendation must be "Y" or "N".';
        }
        return returnValue;
    }

    function errorSaveMovie (jqXHR, textStatus, errorThrown) {
        console.error('Error saving movie: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        alert('An error occured when saving your information:\n' + jqXHR.responseText);
    }

    function requestDeleteMovie(movieId) {
        var requestContent = {
            Key : {
                'MovieID' : movieId
            }
        };
        var requestData = JSON.stringify(requestContent);
        $.ajax({
            method: 'DELETE',
            url: _config.api.invokeUrl + '/movies',
            headers: {
                Authorization: authToken
            },
            data: requestData,
            contentType: 'application/json',
            success: completeDeleteRequest,
            error: errorDeleteMovie,
        });
    }

    function errorDeleteMovie (jqXHR, textStatus, errorThrown) {
        console.error('Error deleting movie: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        alert('An error occured when deleting your movie:\n' + jqXHR.responseText);
    }

    function completeRequest(result) {
        console.log('Response received from API: ', result);
        alert('Movie Saved');
        getMyMovies();
    }

    function completeDeleteRequest(result) {
        console.log('Response received from API: ', result);
        alert('Movie Deleted');
        getMyMovies();
    }

    function getMyMovies() {
        $.ajax({
          method: 'GET',
          url: _config.api.invokeUrl + '/movies',
          headers: {
              Authorization: authToken
          },
          contentType: 'application/json',
          success: completeGetRequest,
          error: errorGetMovie
        });
    }

    function errorGetMovie (jqXHR, textStatus, errorThrown) {
        console.error('Error getting movies: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        alert('An error occured when requesting your movies:\n' + jqXHR.responseText);
    }
    function completeGetRequest(result) {
        console.log('Response received from API: ', result);
        myCurrentMovies = result.data.Items;
        myTotalMovies = result.data.Items.length;
        var pageDesc = 'Total movies I have seen and rated: ' + myTotalMovies;
        buildMyMoviesTable(myCurrentMovies);
        applyDataTable();
    }

    function buildMyMoviesTable(movies) {
        var movieBody = $('#MyMoviesBody');
        movieBody.empty();
        for (var x = 0; x < movies.length; x++) {
            var myRating = movies[x].rating || 'NR';
            var displayTitle = jQuery.trim(movies[x].MovieContent.title).substring(0, 30);
            if (movies[x].MovieContent.title.length > 30)
                displayTitle += '...';
            var imageURL = 'https://image.tmdb.org/t/p/w200/' + movies[x].MovieContent.poster_path;
            var tdImage = '<td><a href="javascript:showEditDetail(' + x + ')">' + '<img src="' + imageURL + '" class="imgList">' + '</a></td>';
            var tdTitle = '<td><a href="javascript:showEditDetail(' + x + ')">' + displayTitle + '</a></td>';
            var tableRow = '<tr>' + tdImage + tdTitle + '<td>' + myRating + '</td></tr>';
            movieBody.append(tableRow);
        }
    }

    function getMovies(year, page) {
        var defaultYear = '2018';
        var defaultPage = 1;
        var queryPage = page || defaultPage;
        var MovieURL = 'https://api.themoviedb.org/3/discover/movie?api_key=826bba7bb62beb4e9303d0bb35751426&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=' + queryPage + '&primary_release_year=' + queryYear;
        var queryYear = year || defaultYear;
        $('#movieYear').val(queryYear);
        moviesYear = queryYear;
        $.ajax({
            method: 'GET',
            url: MovieURL,
            contentType: 'application/json',
            success: movieCompleteRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error getting movies: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured requesting your movies:\n' + jqXHR.responseText);
            }
        });
    }

    function movieCompleteRequest(result) {
      currentMovieList = result.results;
        totalPages = result.total_pages;
        currentPage = result.page;
      totalMovies = result.total_results;
      var pageDesc = 'Page ' + currentPage + ' of ' + totalPages + ' (' + totalMovies + ' total movies in ' + moviesYear + ')';
      $('#pageDescription').text(pageDesc);
      buildMoviesTable(currentMovieList);
      applyDataTable();
    }

    function applyDataTable() {
      $('#MyMoviesTable').DataTable();
    }

    function buildMoviesTable (movies) {
        var movieBody = $('#MoviesBody');
        movieBody.empty();
        for (var x = 0; x < movies.length; x++) {
          var displayTitle = jQuery.trim(movies[x].title).substring(0, 30);
          if (movies[x].title.length > 30)
              displayTitle += '...';
          var tdTitle = '<td><a href="javascript:showDetail(' + x + ')">' + displayTitle + '</a></td>';
          var tableRow = '<tr>' + tdTitle + '<td>' + movies[x].vote_average + '</td><td>' + movies[x].release_date + '</td></tr>';
          movieBody.append(tableRow);
        }
    }

    function handleMovieRefresh(event) {
      var selectedMovieYear = parseInt($('#movieYear').val()) || 2018;
      getMovies(selectedMovieYear, 1);
    }
    function handleMoviePaging(event) {
      getMovies(moviesYear, currentPage + 1);
    }
    function handleAddMovie(event) {
      var movieIdx = $('#movieIdx').val();
      requestAddMovie(movieIdx);
    }
    function handleSaveMovie(event) {
        var movieIdx = $('#EditMovieIdx').val();
        requestSaveMovie(movieIdx);
    }
    function handleDeleteMovie(event) {
        var movieIdx = $('#EditMovieIdx').val();
        requestDeleteMovie(movieIdx);
    }
    function updateMenu() {

    }
}(jQuery));

function showDetail(movieIdx) {
    var movie = currentMovieList[movieIdx];
    console.log(movie);
    var imageURL = 'https://image.tmdb.org/t/p/w200/' + movie.poster_path;
    var videoAvailability = 'No';
    if (movie.video)
        videoAvailability = 'Yes';
    $("#modalVideo").text(videoAvailability);
    $("#modalPopularity").text(movie.popularity);
    $("#modalLanguage").text(movie.original_language);
    $("#modalGenres").text(getGenres(movie.genre_ids));
    $("#modalMovieImage").attr("src",imageURL);
    $('#movieIdx').val(movieIdx);
    $('#modalMovieTitle').text(movie.title);
    $('#modalMovieDescription').text(movie.overview);
    $('#movieModal').modal('show');
}

function showEditDetail(movieIdx) {
    var movie = myCurrentMovies[movieIdx];
    console.log(movie);
    var imageURL = 'https://image.tmdb.org/t/p/w200/' + movie.MovieContent.poster_path;
    var videoAvailability = 'No';
    if (movie.MovieContent.video)
        videoAvailability = 'Yes';
    $('#modalEditDescription').text(movie.MovieContent.overview);
    $("#cost").val(movie.cost);
    $("#location").val(movie.location);
    $("#rating").val(movie.rating);
    $("#notes").val(movie.notes);
    $("#recommend").val(movie.recommend);
    $("#modalEditMovieImage").attr("src",imageURL);
    $('#EditMovieIdx').val(movieIdx);
    $('#modalEditTitle').text(movie.MovieContent.title);
    $('#editModal').modal('show');
}

function getGenres (movieGenreArray) {
  var genres = [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 12,
      "name": "Adventure"
    },
    {
      "id": 16,
      "name": "Animation"
    },
    {
      "id": 35,
      "name": "Comedy"
    },
    {
      "id": 80,
      "name": "Crime"
    },
    {
      "id": 99,
      "name": "Documentary"
    },
    {
      "id": 18,
      "name": "Drama"
    },
    {
      "id": 10751,
      "name": "Family"
    },
    {
      "id": 14,
      "name": "Fantasy"
    },
    {
      "id": 36,
      "name": "History"
    },
    {
      "id": 27,
      "name": "Horror"
    },
    {
      "id": 10402,
      "name": "Music"
    },
    {
      "id": 9648,
      "name": "Mystery"
    },
    {
      "id": 10749,
      "name": "Romance"
    },
    {
      "id": 878,
      "name": "Science Fiction"
    },
    {
      "id": 10770,
      "name": "TV Movie"
    },
    {
      "id": 53,
      "name": "Thriller"
    },
    {
      "id": 10752,
      "name": "War"
    },
    {
      "id": 37,
      "name": "Western"
    }
  ];
  var allGenres = '';
  function getThisGenre (genreID) {
    for (var idx = 0; idx < genres.length; idx++) {
      if (genres[idx].id == genreID) {
        return ' ' + genres[idx].name;
      }
    }
  }
  for (var idx = 0; idx < movieGenreArray.length; idx++) {
      allGenres += getThisGenre(movieGenreArray[idx]);
  }
  return allGenres;

}

