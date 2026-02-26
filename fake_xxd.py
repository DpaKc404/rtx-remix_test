#!/usr/bin/env python3
import sys
import re

if len(sys.argv) != 4:
    print("Usage: fake_xxd.py <input> <output> <basename>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]
basename = sys.argv[3]

# Create a C array from a binary file
with open(input_file, 'rb') as f:
    data = f.read()

# Replace non-alphanumeric chars in basename with underscore
safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', basename)

with open(output_file, 'w') as f:
    f.write("unsigned char %s[] = {\n" % safe_name)
    for i, byte in enumerate(data):
        if i % 12 == 0:
            f.write("    ")
        f.write("0x%02x, " % byte)
        if i % 12 == 11:
            f.write("\n")
    f.write("\n};\n")
    f.write("unsigned int %s_len = %d;\n" % (safe_name, len(data)))
