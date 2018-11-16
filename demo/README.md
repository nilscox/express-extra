# ExpressExtra demo

This is a demo project using `express-extra`, it should give a pretty good
overview of the whole library.

The demo is an API server that should handle books managment for a library,
such as authors and books creation, and book renting / returning with some sort
of maximum quota.

To start the server, install the dependencies first (`npm install`), then run
`npm start`. You can now access it through `http://localhost:4242` (I like using
[httpie](https://httpie.org/) to try out APIs...)

Let's have a deeper look at the project...

## The library

First, the model of our app is represented by two entities : authors and books.
Obviously, a book *has one* author, and an author *has many* books. This is
defined in the `db.js` file, using [Sequelize](https://sequelizejs.com) as ORM,
and a sqlite file storage.

Then, we need some endpoints to read the values from the database through the
API:

- `GET /api/author`: retrieve all the authors, with all their books
- `GET /api/author/:id`: retrieve a single author, with all his books
- `GET /api/book`: retrieve all the books, with their author
- `GET /api/book/:id`: retrieve a single book, with its author

Next, we need some endpoints to create authors and books:

- `POST /api/author`: create an author
- `POST /api/book`: create a book

To create an author, we need to provide an object in the response body. The
API must check that the input matches:

```
{
  firstname: string,
  lastname: string,
}
```

The same applies to create a book, with an object of type:

```
{
  title: string,
  EAN: 13-digits string,
  nbPages: positive integer,
  authorId: integer,
}
```

Author and book creation can be achieve at the same time, by providing an
`author` field instead of an authorId:

```
{
  title: string,
  EAN: 13-digits string,
  nbPages: positive integer,
  author: {
    firstname: string,
    lastname: string,
  },
}
```

Finally, we have two more endpoints to rent and return a book:

- `POST /api/book/:id/rent`: rent a book
- `POST /api/book/:id/return`: renturn a rented book

To rent or return a book, the server needs to remember who rented what, so
theses values are stored in the session, for simplicity. Also, we assume that
the library have an illimited number of edition of each book, so multiple users
can rent the same book at the same time.

## Example

Now let's query the demo API and see how it reacts to our inputs. When the demo
is launched, the database is recreated. So our endpoints to list the authors
and books show empty arrays.

`GET /api/author 200`
```js
[]
```

`GET /api/book 200`
```js
[]
```

If we want to access a book by its *id*, well... it is not found, that's
expected.

`GET /api/book/2 404`
```js
{
  "error": "Not found",
  "resource": "book"
}
```

Now, let's create some data.

`POST /api/author 201`
```js
{
  "firstname": "Gorges",
  "lastname": "Martin",
  "middlename": "R.R."
}
```
```js
{
  "id": 1,
  "name": "Gorges MARTIN"
}
```

Note that the "middlename" field is not expected by the API, it is then
discarded. The endpoints to list the authors are now returning the value we
just created.

`GET /api/author 200`
```js
[
  {
    "id": 1,
    "name": "Gorges MARTIN",
    "books": []
  }
]
```

`GET /api/author/1 200`
```js
{
  "id": 1,
  "name": "Gorges MARTIN",
  "books": []
}
```

We should add some books too.

`POST /api/book 201`
```js
{
  "title": "Game of thrones",
  "EAN": "1234567890123",
  "nbPages": 645,
  "authorId": 1
}
```
```js
{
  "id": 1,
  "title": "Game of thrones",
  "nbPages": 645,
  "author": {
    "id": 1,
    "name": "Gorges MARTIN"
  }
}
```

And let's try to create a book and its author at the same time.

`POST /api/book 201`
```js
{
  "title": "The hichicker's guide to the galaxy",
  "EAN": "1230123456789",
  "nbPages": 137,
  "author": {
    "firstname": "Douglas",
    "lastname": "Adams"
  }
}
```
```js
{
  "id": 2,
  "title": "The hichicker's guide to the galaxy",
  "nbPages": 137,
  "author": {
    "id": 2,
    "name": "Douglas ADAMS"
  }
}
```

One more book?

`POST /api/book 201`
```js
{
  "title": "Dirk Genlty's holistic detective agency",
  "EAN": "1231234567890",
  "nbPages": 239,
  "authorId": 2
}
```
```js
{
  "id": 3,
  "title": "Dirk Genlty's holistic detective agency",
  "nbPages": 239,
  "author": {
    "id": 2,
    "name": "Douglas ADAMS"
  }
}
```

If we send an object that does not stictly respect the expected format, a bad
request status happens, and the response body describes all invalid fields.

`POST /api/book 400`
```js
{
  "title": null,
  "nbPages": -8,
  "author": {
    "firstname": true,
    "lastname": "   "
  }
}
```
```js
{
  "title": "Invalid value type",
  "nbPages": "this field must be positive",
  "EAN": "Missing value",
  "author.firstname": "Invalid value type",
  "author.lastname": "this field must not be empty"
}
```

Now we can easily read all our data.

`GET /api/book 200`
```js
[
  {
    "id": 1,
    "title": "Game of thrones",
    "nbPages": 645,
    "author": {
      "id": 1,
      "name": "Gorges MARTIN"
    }
  },
  {
    "id": 2,
    "title": "The hichicker's guide to the galaxy",
    "nbPages": 137,
    "author": {
      "id": 2,
      "name": "Douglas ADAMS"
    }
  },
  {
    "id": 3,
    "title": "Dirk Genlty's holistic detective agency",
    "nbPages": 239,
    "author": {
      "id": 2,
      "name": "Douglas ADAMS"
    }
  }
]
```

`GET /api/book/1 200`
```js
{
  "id": 1,
  "title": "Game of thrones",
  "nbPages": 645,
  "author": {
    "id": 1,
    "name": "Gorges MARTIN"
  }
}
```

`GET /api/author/2 200`
```js
{
  "id": 2,
  "name": "Douglas ADAMS",
  "books": [
    {
      "id": 2,
      "title": "The hichicker's guide to the galaxy",
      "nbPages": 137
    },
    {
      "id": 3,
      "title": "Dirk Genlty's holistic detective agency",
      "nbPages": 239
    }
  ]
}
```

You want to read a book? Let's rent GoT, which have the id `1`.

`POST /api/book/1/rent 200`
```plain
Have fun reading Game of thrones!
```

Now, we can't rent it again.

> Note: the api client must keep track of the session

`POST /api/book/1/rent 400`
```js
{
  "error": "you already have this book"
}
```

`POST /api/book/2/rent 200`
```js
Have fun reading The hichicker's guide to the galaxy!
```

We now have 2 books, and the limit is reached. We can't rent another book...

`POST /api/book/3/rent 401`
```js
{
  "error": "quota exceeded"
}
```

But we can return one before!

`POST /api/book/2/return 200`
```plain
Thank you for returning The hichicker's guide to the galaxy.
```

`POST /api/book/3/rent 200`
```plain
Have fun reading Dirk Genlty's holistic detective agency!
```

Now we're at the limit again.

`POST /api/book/2/rent 401`
```js
{
  "error": "quota exceeded"
}
```

But we still can rent the book if we are admin, in which case we need to
include a header field : `token: zorglub`.

`POST /api/book/2/rent (token: zorglub) 200`
```js
Have fun reading The hichicker's guide to the galaxy!
```

So, this is it. play out with the demo, try to send weird data to it or to
crash it, and see how it responds. Oh and by the way, if you find something
that's not expected, feel free to fill an issue!
