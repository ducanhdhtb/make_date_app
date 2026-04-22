# Sequence diagram

## 1. Like -> Match
```text
User A -> API: POST /likes (targetUserId=B)
API -> DB: check existing like A->B
API -> DB: check reverse like B->A
alt reverse like exists
  API -> DB: create/update match(active)
  API -> DB: create notification(match_created)
  API -> User A: matched=true
else
  API -> DB: create like
  API -> User A: matched=false
end
```

## 2. Mở chat sau khi match
```text
User A -> API: POST /conversations (targetUserId=B)
API -> DB: check active match(A,B)
API -> DB: check no block(A,B)
alt conversation exists
  API -> User A: return existing conversation
else
  API -> DB: create conversation + 2 participants
  API -> User A: return new conversation
end
```

## 3. Gửi tin nhắn
```text
User A -> API: POST /conversations/:id/messages
API -> DB: check participant
API -> DB: create message
API -> DB: create notification(new_message) for User B
API -> User A: message created
```

## 4. Block user
```text
User A -> API: POST /blocks
API -> DB: upsert block(A,B)
API -> DB: update match status = blocked
API -> User A: blocked=true
```

## 5. Report nội dung
```text
User A -> API: POST /reports
API -> DB: create report(targetType, reason, details)
API -> User A: report submitted
```
