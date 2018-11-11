# yerlshrtnr - API

Generates short URLs with the option for custom id's and expiration time.

**URL** : `/api/shorturl/`

**Method** : `PUT`


## Success Response

**Code** : `200 OK`

**Content** : 
```json
        {
            "message": "Short URL successfully generated.",
            "originalURL": "https://devcenter.heroku.com/articles/custom-domains#add-a-custom-domain-with-a-subdomain",
            "shortURL": "yerlshrt.tk/2KLxVZE",
            "expires": true,
            "ttl": 216000
        }
```

## Error Response

**Condition** : Duplicate key

**Code** : `400`

**Content** : 
```json
        {
            "error": 
            {
                "type": "DUPLICATE", 
                "message": "key bubbles could not be generated. Key already taken"
        }
```