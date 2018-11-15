h() {
  echo "$1 $2" | sed 's/:4242//'
  http --session /tmp/httpie.session -p Bb --pretty=none "$@" | jq .
  echo
}

h GET :4242/api/author token:zorglub
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

rm -f /tmp/httpie.session
