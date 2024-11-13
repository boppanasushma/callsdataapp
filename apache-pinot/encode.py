import urllib.parse

base_url = "http://34.71.204.44:9000/ingestFromFile"
table_name = "call_analytics_OFFLINE"
config = {"inputFormat": "csv", "recordReader.prop.delimiter": ","}

import json

config_str = json.dumps(config)
encoded_config = urllib.parse.quote(config_str)

final_url = (
    f"{base_url}?tableNameWithType={table_name}&batchConfigMapStr={encoded_config}"
)
print("Encoded URL:", final_url)

# Print the curl command
print("\nCurl command:")
print(
    f'curl -X POST -F "file=@converted_call_data.csv" -H "Content-Type: multipart/form-data" "{final_url}"'
)
