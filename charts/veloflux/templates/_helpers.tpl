{{- define "veloflux.redisAddr" -}}
{{- if .Values.redis.host }}
{{ .Values.redis.host }}
{{- else }}
redis:6379
{{- end }}
{{- end -}}
