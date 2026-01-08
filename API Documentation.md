**Authentication**

---

**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**POST,/api/v1/user/login,Get API token using email and password,emailUser's emailpasswordUser's password,API Token,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/user/login \\-d email=user@example.com \\-d password=yourpassword"**

**POST,/api/v1/login-token,Generate one time login token,"(No specific parameters listed in text, but example uses api\_token)",Token string,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/login-token \\-d api\_token=0f2HByoTr9y6...  User Login URL:`https://new.reelsend.com/login/token/"**




**Lists**

---

**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**POST,/api/v1/lists,New listCreate a new contact list.,Basic Info:$name$from\_email$from\_nameContact Info:$contact\[company]$contact\[state]$contact\[address\_1]$contact\[address\_2]$contact\[city]$contact\[zip]$contact\[phone]$contact\[country\_id]$contact\[email]$contact\[url] (optional)Settings:$subscribe\_confirmation$send\_welcome\_email$unsubscribe\_notification,Creation messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists \\-d api\_token=0f2HByo... \\-d name=List+1 \\-d from\_email=admin@abccorp.org \\-d contact\[company]=ABC+Corp. \\..."**

**GET,/api/v1/lists,Get information about all lists,(None),List of all user's mail lists in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists \\-d api\_token=0f2HByo..."**

**GET,/api/v1/lists/{uid},Get information about a specific list,URL Parameter:$uid: List's unique ID,All list information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists/{uid} \\-d api\_token=0f2HByo..."**

**POST,/api/v1/lists/{uid}/add-field,Add custom field to list,"$type (text, number, datetime)$label$tag (alpha-numeric, dashes, underscores)$default\_value (optional)",Creation messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists/{uid}/add-field \\-d api\_token=0f2HByo... \\-d type=text \\-d label=Custom \\-d tag=CUSTOM\_FIELD\_1 \\-d default\_value=test"**

**DELETE,/api/v1/lists/{uid},Delete a list,$uid: List's unique ID,Result messages in JSON,"curl -X DELETE -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists/{uid} \\-d api\_token=0f2HByo..."**





**CAMPAIGNS**

---

**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**GET,/api/v1/campaigns,Get information about all campaigns,"$per\_page (optional, default: 10)Number of subscribers per page$pagePage number",List of all user's campaigns in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns \\-d api\_token=0f2HByoTr9..."**

**POST,/api/v1/campaigns,Add new campaign,$list\_uid: List's uid$name: Campaign name$subject: Email subject$from\_email: From email$from\_name: From name$reply\_to: Reply-to email$track\_open: (true/false) default: true$track\_click: (true/false) default: true$sign\_dkim: (true/false) default: true$skip\_failed\_messages: (true/false) default: false$html: Campaign HTML content,New campaign's information in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns \\-d api\_token=0f2HByoTr9... \\-d mail\_list\_uid={list\_uid} \\-d name=MyCampaign \\-d subject=HelloWorld \\-d from\_email=noreply@gmail.com \\-d from\_name=NoReply \\-d reply\_to=noreply@gmail.com \\-d track\_open=true \\-d track\_click=true \\-d sign\_dkim=false \\-d skip\_failed\_messages=false \\-d html='<p>Hello!</p>'"**

**GET,/api/v1/campaigns/{uid},Get information about a specific campaign,$uid (in URL)Campaign's unique ID,Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid} \\-d api\_token=0f2HByoTr9..."**

**PATCH,/api/v1/campaigns/{uid},Update campaign,$list\_uid$name$subject$from\_email$from\_name$reply\_to$track\_open$track\_click$sign\_dkim$skip\_failed\_messages,New campaign's information in JSON,"curl -X PATCH -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid} \\-d api\_token=0f2HByoTr9... \\-d name=MyCampaign2 \\-d subject=HelloWorld2 \\-d sign\_dkim=true"**

**POST,/api/v1/campaigns/{uid}/run,Run a specific campaign,(None),Action messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/run \\-d api\_token=0f2HByoTr9..."**

**POST,/api/v1/campaigns/{uid}/pause,Pause a specific campaign,(None),Action messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/pause \\-d api\_token=0f2HByoTr9..."**

**POST,/api/v1/campaigns/{uid}/resume,Resume a specific campaign,(None),Action messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/resume \\-d api\_token=0f2HByoTr9..."**

**DELETE,/api/v1/campaigns/{uid},Delete a campaign,$uid (in URL)Campaign's uid,Result messages in JSON,"curl -X DELETE -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid} \\-d api\_token=0f2HByoTr9..."**

**GET,/api/v1/campaigns/{uid}/tracking-log/download,Download campaign tracking log,$formatLog format (default: CSV),Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/tracking-log/download \\-d type=csv \\-d api\_token=0f2HByoTr9..."**

**GET,/api/v1/campaigns/{uid}/open-log/download,Download campaign open log,$formatLog format (default: CSV),Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/open-log/download \\-d type=csv \\-d api\_token=0f2HByoTr9..."**

**GET,/api/v1/campaigns/{uid}/click-log/download,Download campaign click log,$formatLog format (default: CSV),Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/click-log/download \\-d type=csv \\-d api\_token=0f2HByoTr9..."**

**GET,/api/v1/campaigns/{uid}/bounce-log/download,Download campaign bounce log,$formatLog format (default: CSV),Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/bounce-log/download \\-d type=csv \\-d api\_token=0f2HByoTr9..."**

**GET,/api/v1/campaigns/{uid}/feedback-log/download,Download campaign feedback log,$formatLog format (default: CSV),Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/feedback-log/download \\-d type=csv \\-d api\_token=0f2HByoTr9..."**

**GET,/api/v1/campaigns/{uid}/unsubscribe-log/download,Download campaign unsubscribe log,$formatLog format (default: CSV),Campaign's information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/campaigns/{uid}/unsubscribe-log/download \\-d type=csv \\-d api\_token=0f2HByoTr9..."**









### **SUBSCRIBERS**





**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**GET,/api/v1/subscribers,Display list's subscribers,"$list\_uid: List's uid$open: (optional) yes (opened some), no (opened none), default: all$click: (optional) yes (clicked some), no (clicked none), default: all$per\_page: Subscribers per page (default: 25)$page: Page number",List of all list's subscribers in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers \\-d api\_token=0f2HBy... \\-d list\_uid={list\_uid} \\-d per\_page=20 \\-d page=1"**

**POST,/api/v1/subscribers,Create subscriber for a mail list,"$list\_uid: List's uid$EMAIL: Subscriber's email$tag: (optional) Comma-separated tags$status: subscribed, unsubscribed, unconfirmed$\[OTHER\_FIELDS]: Custom fields (e.g., FIRST\_NAME, LAST\_NAME)",Creation messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers \\-d api\_token=0f2HBy... \\-d list\_uid={list\_uid} \\-d EMAIL=test@gmail.com \\-d tag=foo,bar \\-d FIRST\_NAME=Marine \\-d status=subscribed"**

**GET,/api/v1/subscribers/{id},Get information about a specific subscriber,$id: Subscriber's id or email,All subscriber information in JSON,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers/{id} \\-d api\_token=0f2HBy..."**

**PATCH,/api/v1/subscribers/{id},Update subscriber for a mail list,$uid: Subscriber's uid$EMAIL: Subscriber's email$tag: Comma-separated tags$\[OTHER\_FIELDS]: Custom fields,Update messages in JSON,"curl -X PATCH -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers/{id} \\-d api\_token=0f2HBy... \\-d EMAIL=test@gmail.com \\-d tag=foo,bar \\-d FIRST\_NAME=Marine \\-d status=unsubscribed"**

**POST,/api/v1/subscribers/{id}/add-tag,Add tag(s) to subscriber,"$tag: Subscriber's tags, separated by a comma (,)",Creation messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers/{id}/add-tag \\-d api\_token=0f2HBy... \\-d tag=foo,bar"**

**POST,/api/v1/subscribers/{id}/remove-tag,Remove tag(s) from subscriber,"$tag: Subscriber's tags, separated by a comma (,)",Update messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers/{id}/remove-tag \\-d api\_token=0f2HBy... \\-d tag=foo,bar"**

**GET,/api/v1/subscribers/email/{email},Find subscribers with email,$email: Subscriber's email,All subscribers with the email,"curl -X GET -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers/email/{email} \\-d api\_token=0f2HBy..."**

**PATCH,/api/v1/lists/{list\_uid}/subscribers/{id}/subscribe,Subscribe a subscriber,$list\_uid: List's uid$id: Subscriber's id,Result messages in JSON,"curl -X PATCH -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists/{list\_uid}/subscribers/{id}/subscribe \\-d api\_token=0f2HBy..."**

**PATCH,/api/v1/lists/{list\_uid}/subscribers/{id}/unsubscribe,Unsubscribe a subscriber,$list\_uid: List's uid$id: Subscriber's id,Result messages in JSON,"curl -X PATCH -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists/{list\_uid}/subscribers/{id}/unsubscribe \\-d api\_token=0f2HBy..."**

**PATCH,/api/v1/lists/{list\_uid}/subscribers/email/{email}/unsubscribe,Unsubscribe a subscriber by email,$list\_uid: List's uid$email: Subscriber's email,Result messages in JSON,"curl -X PATCH -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/lists/{list\_uid}/subscribers/email/{email}/unsubscribe \\-d api\_token=0f2HBy..."**

**DELETE,/api/v1/subscribers/{id},Delete a subscriber,$list\_uid: List's uid$id: Subscriber's id,Result messages in JSON,"curl -X DELETE -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/subscribers/{id} \\-d api\_token=0f2HBy..."**









### **Notification**



**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**POST,/api/v1/notification/bounce,Send a HARD bounce to the applicationNotice that it is not needed to inform the application of SOFT bounces.,$message\_idMessage's id$descriptionNotification message,Action messages in JSON,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/notification/bounce \\-d api\_token=0f2HBy... \\-d message\_id=201637442604422402.6199642caf7f3@example.com"**









### **Feedback Loop**



**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**POST,/api/v1/notification/feedback,Send a bounce or abuse report to the applicationIt could be a success / bounce / feedback or abuse report.,$message\_idMessage's id$typePossible values include: spam,abuse$descriptionNotification message,Action messages in JSON**





**FILE**




**HTTP Method,Endpoint,Function,Parameters,Returns,Example**

**POST,/api/v1/file/upload,Upload file(s) to customer's storage,$file\_urlFile url$subdirectory (optional)Custom subdirectory (default: user root directory),Upload result message,"curl -X POST -H ""accept:application/json"" -G \\https://new.reelsend.com/api/v1/file/upload \\-d api\_token=0f2HBy... \\-d files='\[{""url"":""http://example.com/images/logo\_big.svg"", ""subdirectory"":""path/to/file""}, {""url"":""http://example.com/images/logo\_big.svg"", ""subdirectory"":""path/to/file2""}]'"**



