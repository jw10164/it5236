/*global MyMovies _config*/

var MyMovies = window.MyMovies || {};
var currentMovieList = null;

var movieScope = (function moviesScopeWrapper($) {
  var currentPage = 1;
  var totalPages = 0;
  var totalMovies = 0;
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
    function requestAddMovie(movieIdx) {
        var movie = currentMovieList[movieIdx];
        movie.myrating = 5;
        movie.notes = 'No notes recorded yet.';
        movie.location = 'Statesboro AMC';
        movie.cost = '$5.00';
        movie.watched = '1';
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
    function completeRequest(result) {
        console.log('Response received from API: ', result);
        alert('Movie Added');
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
    }

    function getMovies(year, page) {
        var defaultYear = '2018';
        var defaultPage = 1;
        var queryPage = page || defaultPage;
        var queryYear = year || defaultYear;
        var MovieURL = 'https://api.themoviedb.org/3/discover/movie?api_key=826bba7bb62beb4e9303d0bb35751426&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=' + queryPage + '&primary_release_year=' + queryYear;
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
      currentPage = result.page;
      totalPages = result.total_pages;
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

    $(function onDocReady() {
        $('#refreshMovies').click(handleMovieRefresh);
        $('#nextPage').click(handleMoviePaging);
        $('#addMovie').click(handleAddMovie);
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

