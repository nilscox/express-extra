h() {
  echo "$@" | sed 's/:4242//'
  http --session /tmp/httpie.session -p b --pretty=none "$@" | jq .
  echo
}

h GET :4242/api/author
h GET :4242/api/book

h POST :4242/api/author firstname:='"Gorges"' lastname:='"Martin"'

h GET :4242/api/author
h GET :4242/api/author/1

h POST :4242/api/book title:="\"Game of thrones\"" EAN:="\"1234567890123\"" nbPages:=645 authorId:=1
h POST :4242/api/book title:="\"The hichicker's guide to the galaxy\"" EAN:="\"1230123456789\"" nbPages:=137 author:="{\"firstname\":\"Douglas\",\"lastname\":\"Adams\"}"
h POST :4242/api/book title:="\"Dirk Genlty's holistic detective agency\"" EAN:="\"1231234567890\"" nbPages:=239 authorId:=2

h GET :4242/api/book
h GET :4242/api/book/1
h GET :4242/api/author/2

h POST :4242/api/book title:="\"The Pirate Planet\"" EAN:="\"1234567890321\"" nbPages:=341 authorId:=2
h POST :4242/api/book token:zorglub title:="\"The Pirate Planet\"" EAN:="\"1234567890321\"" nbPages:=341 authorId:=2

rm -f /tmp/httpie.session
